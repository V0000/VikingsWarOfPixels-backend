import { config as dotenvConfig } from "dotenv";
import { join } from "path";

dotenvConfig({ path: join(__dirname, '../.env') });

export const config = {
    database: process.env.DATABASE,
    game: {
        name: "Test",
        ended: false,
        cooldown: 300,
        height: 80,
        width: 160,
    },
    expiresIn: 30000,
    syncTime: 15000,
    moderatorCooldown: 50,
    frontend: process.env.FRONTEND_URL!
}