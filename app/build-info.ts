import manifest from "../package.json" with { type: "json" };
export const VERSION = manifest.version;
export const RELEASE_STAGE = "Pre-Alpha";
export const BUILD = `TEN TRENER — ${RELEASE_STAGE} v${VERSION}`;
export const PROJECT_DESCRIPTION = "TEN TRENER to gra menedżersko-symulacyjna przedstawiająca drogę trenera piłkarskiego przez realia polskiej piłki — od najniższych szczebli po profesjonalną karierę.";
