export default defineBackground(() => {
  // Open side panel when extension icon is clicked
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
});
