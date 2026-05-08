import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from './locales/en.json'
import zh from './locales/zh.json'
import vi from './locales/vi.json'

const STORAGE_KEY = 'ds2api_lang'
const translations = { en, zh, vi }
const SUPPORTED_LANGS = new Set(['en', 'zh', 'vi'])
const DEFAULT_LANG = 'vi'

const I18nContext = createContext({
    lang: DEFAULT_LANG,
    setLang: () => {},
    t: (key) => key,
})

const getBrowserLang = () => {
    if (typeof navigator === 'undefined') return DEFAULT_LANG
    const raw = navigator.language?.toLowerCase() || ''
    if (raw.startsWith('vi')) return 'vi'
    if (raw.startsWith('zh')) return 'zh'
    if (raw.startsWith('en')) return 'en'
    return DEFAULT_LANG
}

const normalizeLang = (value) => {
    if (typeof value !== 'string') return null
    const lower = value.toLowerCase()
    if (SUPPORTED_LANGS.has(lower)) return lower
    return null
}

const getValue = (obj, key) => {
    if (!obj) return undefined
    return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj)
}

const formatMessage = (message, vars) => {
    if (!vars) return message
    return message.replace(/\{(\w+)\}/g, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(vars, key)) {
            return vars[key]
        }
        return match
    })
}

export const I18nProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        if (typeof localStorage === 'undefined') return getBrowserLang()
        const stored = normalizeLang(localStorage.getItem(STORAGE_KEY))
        return stored || getBrowserLang()
    })

    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, lang)
        }
        if (typeof document !== 'undefined') {
            const docLang = lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : 'en'
            document.documentElement.lang = docLang
        }
    }, [lang])

    const t = useMemo(() => {
        return (key, vars) => {
            const value =
                getValue(translations[lang], key) ??
                getValue(translations[DEFAULT_LANG], key) ??
                getValue(translations.en, key) ??
                key
            if (typeof value !== 'string') return value
            return formatMessage(value, vars)
        }
    }, [lang])

    const contextValue = useMemo(() => ({ lang, setLang, t }), [lang, t])

    return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
