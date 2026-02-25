import { ReactElement, ReactNode, useState } from 'react';
import styles from './StrategiesV2.module.css';

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: AccordionSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.accordionTitle}>{title}</span>
        <span className={`${styles.accordionArrow} ${isOpen ? styles.accordionArrowOpen : ''}`}>
          ▶
        </span>
      </button>
      {isOpen && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}
