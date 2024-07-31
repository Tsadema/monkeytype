import { navigate } from "../../controllers/route-controller";
import { Command } from "../../types/command";
import { toggleFullscreen } from "../../utils/misc";

const commands: Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    alias: "navigate go to start begin type test",
    icon: "fa-keyboard",
    exec: (): void => {
      navigate("/");
    },
  },
  {
    id: "viewLeaderboards",
    display: "View Leaderboards",
    alias: "navigate go to",
    icon: "fa-crown",
    exec: (): void => {
      $("header nav .textButton.view-leaderboards").trigger("click");
    },
  },
  {
    id: "viewAbout",
    display: "View About Page",
    alias: "navigate go to",
    icon: "fa-info",
    exec: (): void => {
      navigate("/about");
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    alias: "navigate go to",
    icon: "fa-cog",
    exec: (): void => {
      navigate("/settings");
    },
  },

  {
    id: "viewAccount",
    display: "View Account Page",
    alias: "navigate go to stats",
    icon: "fa-user",
    exec: (): void => {
      $("header nav .textButton.view-account").hasClass("hidden")
        ? navigate("/login")
        : navigate("/account");
    },
  },
  {
    id: "toggleFullscreen",
    display: "Toggle Fullscreen",
    icon: "fa-expand",
    exec: (): void => {
      toggleFullscreen();
    },
  },
];

export default commands;
