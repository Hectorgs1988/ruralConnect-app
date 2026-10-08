import {
    useLayoutEffect,
    useRef,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface CajaAdminDialogProps {
    labelledBy: string;
    onClose: () => void;
    fallbackFocusRef: RefObject<HTMLElement | null>;
    returnFocusRef: RefObject<HTMLElement | null>;
    children: ReactNode;
}

const focusableSelector = [
    "a[href]",
    "button:not(:disabled)",
    "input:not(:disabled):not([type='hidden'])",
    "select:not(:disabled)",
    "textarea:not(:disabled)",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function CajaAdminDialog({
    labelledBy,
    onClose,
    fallbackFocusRef,
    returnFocusRef,
    children,
}: CajaAdminDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(document.createElement("div"));

    useLayoutEffect(() => {
        const portal = portalRef.current;
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const inertStates = Array.from(document.body.children)
            .filter((element): element is HTMLElement =>
                element instanceof HTMLElement && element !== portal,
            )
            .map((element) => ({ element, wasInert: element.inert }));

        document.body.appendChild(portal);
        inertStates.forEach(({ element }) => { element.inert = true; });

        const initialFocus = dialogRef.current?.querySelector<HTMLElement>(
            "[data-dialog-autofocus]",
        ) ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
        (initialFocus ?? dialogRef.current)?.focus();

        return () => {
            inertStates.forEach(({ element, wasInert }) => { element.inert = wasInert; });
            portal.remove();
            const restoreTarget = returnFocusRef.current?.isConnected
                ? returnFocusRef.current
                : previouslyFocused?.isConnected
                    ? previouslyFocused
                    : fallbackFocusRef.current;
            restoreTarget?.focus();
        };
    }, [fallbackFocusRef, returnFocusRef]);

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key !== "Tab") return;

        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
        if (!focusable?.length) {
            event.preventDefault();
            dialogRef.current?.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey
            && (document.activeElement === last || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            first.focus();
        }
    }

    return createPortal(
        <div className="caja-admin-dialog-overlay">
            <div
                ref={dialogRef}
                className="caja-admin-dialog-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
            >
                {children}
            </div>
        </div>,
        portalRef.current,
    );
}
