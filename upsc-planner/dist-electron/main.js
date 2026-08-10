import { BrowserWindow as e, app as t } from "electron";
import n from "node:path";
import { fileURLToPath as r } from "node:url";
//#region electron/main.js
var i = n.dirname(r(import.meta.url)), a;
t.whenReady().then(() => {
	a = new e({
		width: 1200,
		height: 800,
		title: "UPSC Planner",
		icon: n.join(i, "../public/pwa-512x512.png"),
		webPreferences: {
			nodeIntegration: !0,
			contextIsolation: !1
		}
	}), process.env.VITE_DEV_SERVER_URL ? a.loadURL(process.env.VITE_DEV_SERVER_URL) : a.loadFile(n.join(i, "../dist/index.html"));
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion
export {};
