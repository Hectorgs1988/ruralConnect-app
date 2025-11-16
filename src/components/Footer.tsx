import type { FC } from "react";

const Footer: FC = () => {
    return (
        <footer className="mt-10 border-t border-borderSoft bg-surface/80">
            <div className="rc-shell py-4 text-center text-xs md:text-sm text-muted">
                Rural Connect · Conectando espacios rurales
            </div>
        </footer>
    );
};

export default Footer;
