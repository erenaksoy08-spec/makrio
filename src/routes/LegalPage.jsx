import { useParams } from 'react-router-dom'
import { LEGAL_PAGES, LEGAL_VARS } from '../lib/legalInfo'
import BackButton from '../components/BackButton'
import { t } from '../lib/i18n'

export default function LegalPage() {
  const { slug } = useParams()
  const page = LEGAL_PAGES[slug]
  // Şirket bilgileri henüz köşeli parantezli yer tutucu; dile göre çevrilir.
  const vars = Object.fromEntries(Object.entries(LEGAL_VARS).map(([k, v]) => [k, t(v)]))

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <BackButton to="/profil" label={t('Profil')} />

      {!page ? (
        <p className="text-sm text-text-muted">{t('Sayfa bulunamadı.')}</p>
      ) : (
        <>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">{t('Yasal')}</div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-text">{t(page.title)}</h1>
          </div>

          <div className="space-y-3">
            {page.sections.map((section, i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/[0.06] bg-surface p-4"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <h2 className="text-sm font-semibold text-text">{t(section.heading)}</h2>
                <div className="mt-2 space-y-2.5">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[13px] leading-relaxed text-text-muted">
                      {/* {company}, {address} gibi yer tutucular burada doldurulur */}
                      {t(p, vars)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="px-1 pb-2 text-center text-[11px] text-text-muted">
            {t('Bu metin bilgilendirme amaçlıdır ve şirket kuruluş süreci tamamlandıkça güncellenecektir.')}
          </p>
        </>
      )}
    </div>
  )
}
