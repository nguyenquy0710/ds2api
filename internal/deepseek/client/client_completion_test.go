package client

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"ds2api/internal/account"
	"ds2api/internal/auth"
	"ds2api/internal/config"
)

func TestCallCompletionDoesNotFallbackForNonIdempotentCompletion(t *testing.T) {
	var fallbackCalled bool
	client := &Client{
		stream: doerFunc(func(*http.Request) (*http.Response, error) {
			return nil, errors.New("ambiguous completion write failure")
		}),
		fallbackS: &http.Client{Transport: roundTripperFunc(func(*http.Request) (*http.Response, error) {
			fallbackCalled = true
			return &http.Response{StatusCode: http.StatusOK}, nil
		})},
	}
	_, err := client.CallCompletion(
		context.Background(),
		&auth.RequestAuth{DeepSeekToken: "token"},
		map[string]any{"prompt": "hello"},
		"pow",
		3,
	)
	if err == nil {
		t.Fatal("expected completion error")
	}
	if fallbackCalled {
		t.Fatal("completion fallback should not be called for a non-idempotent request")
	}
}

func TestCallCompletionNon200SleepsManagedAccountTemporarily(t *testing.T) {
	t.Setenv("DS2API_CONFIG_JSON", `{"keys":["managed-key"],"accounts":[{"email":"acc1@example.com","password":"pwd"}]}`)
	store := config.LoadStore()
	pool := account.NewPool(store)
	resolver := auth.NewResolver(store, pool, func(_ context.Context, _ config.Account) (string, error) {
		return "managed-token", nil
	})
	req, _ := http.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Authorization", "Bearer managed-key")
	a, err := resolver.Determine(req)
	if err != nil {
		t.Fatalf("determine failed: %v", err)
	}
	client := &Client{
		Auth:       resolver,
		nonOKSleep: 60 * time.Millisecond,
		stream: doerFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusInternalServerError,
				Body:       io.NopCloser(strings.NewReader("upstream failed")),
			}, nil
		}),
	}

	resp, err := client.CallCompletion(context.Background(), a, map[string]any{"chat_session_id": "s1"}, "pow", 1)
	if err != nil {
		t.Fatalf("call completion failed: %v", err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 response status, got %d", resp.StatusCode)
	}
	resolver.Release(a)
	if _, ok := pool.Acquire("acc1@example.com", nil); ok {
		t.Fatal("expected account acquire to fail immediately while temporarily sleeping")
	}
	time.Sleep(100 * time.Millisecond)
	acc, ok := pool.Acquire("acc1@example.com", nil)
	if !ok {
		t.Fatal("expected account acquire to recover after temporary sleep")
	}
	pool.Release(acc.Identifier())
}
