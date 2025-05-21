export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

export const showBudgetWarning = (message: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Ostrzeżenie budżetowe", {
      body: message,
      icon: "/icons/warning.png",
    });
  }
};
