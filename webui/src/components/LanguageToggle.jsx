import { useI18n } from '../i18n'

const ORDER = ['vi', 'en', 'zh']
const LABEL_KEY = {
    vi: 'language.vietnamese',
    en: 'language.english',
    zh: 'language.chinese',
}

export default function LanguageToggle({ className = '' }) {
    const { lang, setLang, t } = useI18n()
    const currentIndex = ORDER.indexOf(lang)
    const nextLang = ORDER[(currentIndex + 1) % ORDER.length] || 'vi'
    const label = t(LABEL_KEY[nextLang])

    return (
        <button
            type="button"
            onClick={() => setLang(nextLang)}
            className={`text-xs font-semibold px-2 py-1 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${className}`}
            title={t('language.label')}
        >
            {label}
        </button>
    )
}
