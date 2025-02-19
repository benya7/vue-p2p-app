import type { Constellation } from "@constl/ipa";

export const useConstellation = () => {
    const constl = inject<Constellation>('constl');
    if (constl) return constl;
    throw new Error("Constellation plugin must be installed.");
}
