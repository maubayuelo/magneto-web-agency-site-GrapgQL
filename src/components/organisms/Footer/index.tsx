import './Footer.scss';
import type { FooterProps } from './types';
import { formatParts, getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import { isAnalyticsConfigured } from '@/utils/analytics';
import { PrivacyChoicesButton } from '@/components/organisms/ConsentBanner/PrivacyChoicesButton';

// Phase 5a: line (footerLine2: "Based in Montreal …") · links · copyright. footerLine1 and the social icons are no
// longer rendered.
// Phase 5b (§5.5, D-L): no email link — the Privacy Officer contact lives on /privacy-policy.
// Privacy route (spec §3): the list is always rendered: LinkedIn (only when the CMS URL is set) · Privacy Policy.
// Plain <a> + localizePath, as the Header (Known debt D1).
// Phase 5f §6: "Privacy choices" (a client <button> that reopens the consent banner) follows Privacy Policy, copy order
// EN :170. Rendered only when the build has a valid NEXT_PUBLIC_GA_ID; without it (Version B) the footer is unchanged.
export const Footer: React.FC<FooterProps> = ({ className = '', footerData = null, locale }) => {
  const t = getDictionary(locale);
  const line = footerData?.footerLine2?.trim();
  const linkedinUrl = footerData?.footerSocialIcons?.[0]?.iconUrl?.trim();

  return (
    <footer className={`main footer pt-lg-responsive ${className}`.trim()}>
      {line ? <p className="typo-md-medium typo-center m-0">{line}</p> : null}

      <ul className="footer__links typo-md-medium">
        {linkedinUrl ? (
          <li>
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="footer__link">
              {t.footer.linkedin}
            </a>
          </li>
        ) : null}
        <li>
          <a href={localizePath('/privacy-policy', locale)} className="footer__link">
            {t.common.privacyPolicy}
          </a>
        </li>
        {isAnalyticsConfigured() ? (
          <li>
            <PrivacyChoicesButton />
          </li>
        ) : null}
      </ul>

      <p className="typo-md-medium typo-center mb-lg-responsive">
        {formatParts(t.footer.copyright, { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
};

export default Footer;
