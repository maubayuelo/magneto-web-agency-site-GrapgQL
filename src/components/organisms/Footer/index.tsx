import './Footer.scss';
import type { FooterProps } from './types';
import { formatParts, getDictionary } from '@/i18n/dictionary';

// Phase 5a: line (footerLine2: "Based in Montreal …") · LinkedIn link · copyright.
// footerLine1 and the social icons are no longer rendered; the Privacy link comes with the Privacy route.
// Phase 5b (§5.5, D-L): no email link — the Privacy Officer contact lives on /privacy-policy.
export const Footer: React.FC<FooterProps> = ({ className = '', footerData = null, locale }) => {
  const t = getDictionary(locale);
  const line = footerData?.footerLine2?.trim();
  const linkedinUrl = footerData?.footerSocialIcons?.[0]?.iconUrl?.trim();

  return (
    <footer className={`main footer pt-lg-responsive ${className}`.trim()}>
      {line ? <p className="typo-md-medium typo-center m-0">{line}</p> : null}

      {linkedinUrl ? (
        <ul className="footer__links typo-md-medium">
          <li>
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="footer__link">
              {t.footer.linkedin}
            </a>
          </li>
        </ul>
      ) : null}

      <p className="typo-md-medium typo-center mb-lg-responsive">
        {formatParts(t.footer.copyright, { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
};

export default Footer;
