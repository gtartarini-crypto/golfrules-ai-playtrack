import axios from "axios";

const BASE_URL =
  "https://us-central1-clublink-ai-2.cloudfunctions.net";

export const paceAnalyticsHistoryService = {
  async getHistory(clubId: string, date: string) {
    try {
      const res = await axios.get(`${BASE_URL}/getPaceAnalyticsHistory`, {
        params: { clubId, date },
      });
      return res.data;
    } catch (err) {
      console.error("Errore getHistory:", err);
      return { flights: [] };
    }
  },
};
