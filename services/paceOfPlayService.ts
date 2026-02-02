import { doc, getDoc } from "firebase/firestore";
import { dbData } from "./firebase"; // Firestore clublink

export interface PaceSettings {
    warningThreshold?: number;
    alertThreshold?: number;
}

export const paceOfPlayService = {
    // 🔥 Salvataggio tramite Cloud Run (scrive nel progetto golfrules)
    saveConfig: async (
        clubId: string,
        courseId: string,
        holes: Record<number, number>,
        settings?: PaceSettings
    ) => {
        const url = "https://savepaceofplayconfig-kntz7bdpoq-uc.a.run.app";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                clubId,
                courseId,
                holes,
                settings: settings || null
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error("Cloud Function error: " + text);
        }
    },

    // 🔍 Lettura da golfrules tramite Cloud Function
    getConfigFromGolfrules: async (
        clubId: string,
        courseId: string
    ): Promise<{ exists: boolean; holes?: Record<number, number>; settings?: PaceSettings }> => {
        const url =
            "https://us-central1-golfrules-ai---playtrack.cloudfunctions.net/getPaceOfPlayConfig";

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clubId, courseId })
        });

        const json = await response.json();
        if (!json.exists) return { exists: false };

        return {
            exists: true,
            holes: json.data.holes,
            settings: json.data.settings
        };
    },

    // 🔍 Lettura iniziale da clublink (solo se golfrules non ha ancora dati)
    getInitialConfigFromClublink: async (
        clubId: string,
        courseId: string
    ): Promise<{ holes: Record<number, number>; settings?: PaceSettings }> => {
        if (!dbData) return { holes: {} as Record<number, number> };

        const docId = `${clubId}_${courseId}`;
        const paceRef = doc(dbData, "PaceOfPlay", docId);
        const snap = await getDoc(paceRef);

        if (snap.exists()) {
            const data = snap.data();
            return {
                holes: data.holes || {},
                settings: data.settings
            };
        }

        return { holes: {} };
    },

    // 🔄 Funzione finale che decide da dove leggere
    getConfig: async (
        clubId: string,
        courseId: string
    ): Promise<{ holes: Record<number, number>; settings?: PaceSettings }> => {
        // 1. Prova a leggere da golfrules
        const fromGolfrules = await paceOfPlayService.getConfigFromGolfrules(
            clubId,
            courseId
        );

        if (fromGolfrules.exists) {
            return {
                holes: fromGolfrules.holes!,
                settings: fromGolfrules.settings
            };
        }

        // 2. Altrimenti leggi da clublink (solo la prima volta)
        return await paceOfPlayService.getInitialConfigFromClublink(
            clubId,
            courseId
        );
    }
};