import { appIcon } from "./_icon/AppIcon";

// iOS home-screen icon; Next links it automatically as <link rel="apple-touch-icon">.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
