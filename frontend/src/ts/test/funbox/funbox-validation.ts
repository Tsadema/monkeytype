import * as FunboxList from "@monkeytype/funbox/list";
import * as Notifications from "../../elements/notifications";
import * as Strings from "../../utils/strings";
import { Config, ConfigValue } from "@monkeytype/contracts/schemas/configs";
import { intersect } from "@monkeytype/util/arrays";

export function checkFunboxForcedConfigs(
  key: string,
  value: ConfigValue,
  funbox: string
): {
  result: boolean;
  forcedConfigs?: ConfigValue[];
} {
  if (FunboxList.getByHashSeparatedString(funbox).length === 0)
    return { result: true };

  if (key === "words" || key === "time") {
    if (value === 0) {
      if (funbox === "nospace") {
        console.log("break");
      }
      const fb = FunboxList.getByHashSeparatedString(funbox).filter((f) =>
        f.properties?.includes("noInfiniteDuration")
      );
      if (fb.length > 0) {
        return {
          result: false,
          forcedConfigs: [key === "words" ? 10 : 15],
        };
      } else {
        return { result: true };
      }
    } else {
      return { result: true };
    }
  } else {
    const forcedConfigs: Record<string, ConfigValue[]> = {};
    // collect all forced configs
    for (const fb of FunboxList.getByHashSeparatedString(funbox)) {
      if (fb.frontendForcedConfig) {
        //push keys to forcedConfigs, if they don't exist. if they do, intersect the values
        for (const key in fb.frontendForcedConfig) {
          if (forcedConfigs[key] === undefined) {
            forcedConfigs[key] = fb.frontendForcedConfig[key] as ConfigValue[];
          } else {
            forcedConfigs[key] = intersect(
              forcedConfigs[key],
              fb.frontendForcedConfig[key] as ConfigValue[],
              true
            );
          }
        }
      }
    }

    //check if the key is in forcedConfigs, if it is check the value, if its not, return true
    if (forcedConfigs[key] === undefined) {
      return { result: true };
    } else {
      if (forcedConfigs[key]?.length === 0) {
        throw new Error("No intersection of forced configs");
      }
      return {
        result: (forcedConfigs[key] ?? []).includes(value),
        forcedConfigs: forcedConfigs[key],
      };
    }
  }
}

// function: canSetConfigWithCurrentFunboxes
// checks using checkFunboxForcedConfigs. if it returns true, return true
// if it returns false, show a notification and return false
export function canSetConfigWithCurrentFunboxes(
  key: string,
  value: ConfigValue,
  funbox: string,
  noNotification = false
): boolean {
  let errorCount = 0;
  if (key === "mode") {
    let fb = FunboxList.getByHashSeparatedString(funbox).filter(
      (f) =>
        f.frontendForcedConfig?.["mode"] !== undefined &&
        !(f.frontendForcedConfig["mode"] as ConfigValue[]).includes(value)
    );
    if (value === "zen") {
      fb = fb.concat(
        FunboxList.getByHashSeparatedString(funbox).filter((f) => {
          return (
            f.frontendFunctions?.includes("getWord") ??
            f.frontendFunctions?.includes("pullSection") ??
            f.frontendFunctions?.includes("alterText") ??
            f.frontendFunctions?.includes("withWords") ??
            f.properties?.includes("changesCapitalisation") ??
            f.properties?.includes("nospace") ??
            f.properties?.find((fp) => fp.startsWith("toPush:")) ??
            f.properties?.includes("changesWordsVisibility") ??
            f.properties?.includes("speaks") ??
            f.properties?.includes("changesLayout") ??
            f.properties?.includes("changesWordsFrequency")
          );
        })
      );
    }
    if (value === "quote" || value === "custom") {
      fb = fb.concat(
        FunboxList.getByHashSeparatedString(funbox).filter((f) => {
          return (
            f.frontendFunctions?.includes("getWord") ??
            f.frontendFunctions?.includes("pullSection") ??
            f.frontendFunctions?.includes("withWords") ??
            f.properties?.includes("changesWordsFrequency")
          );
        })
      );
    }

    if (fb.length > 0) {
      errorCount += 1;
    }
  }
  if (key === "words" || key === "time") {
    if (!checkFunboxForcedConfigs(key, value, funbox).result) {
      if (!noNotification) {
        Notifications.add("Active funboxes do not support infinite tests", 0);
        return false;
      } else {
        errorCount += 1;
      }
    }
  } else if (!checkFunboxForcedConfigs(key, value, funbox).result) {
    errorCount += 1;
  }

  if (errorCount > 0) {
    if (!noNotification) {
      Notifications.add(
        `You can't set ${Strings.camelCaseToWords(
          key
        )} to ${value.toString()} with currently active funboxes.`,
        0,
        {
          duration: 5,
        }
      );
    }
    return false;
  } else {
    return true;
  }
}

export function canSetFunboxWithConfig(
  funbox: string,
  config: Config
): boolean {
  console.log("cansetfunboxwithconfig", funbox, config.mode);
  let funboxToCheck = config.funbox;
  if (funboxToCheck === "none") {
    funboxToCheck = funbox;
  } else {
    funboxToCheck += "#" + funbox;
  }
  const errors = [];
  for (const [configKey, configValue] of Object.entries(config)) {
    if (
      !canSetConfigWithCurrentFunboxes(
        configKey,
        configValue,
        funboxToCheck,
        true
      )
    ) {
      errors.push({
        key: configKey,
        value: configValue,
      });
    }
  }
  if (errors.length > 0) {
    const errorStrings = [];
    for (const error of errors) {
      errorStrings.push(
        `${Strings.capitalizeFirstLetter(
          Strings.camelCaseToWords(error.key)
        )} cannot be set to ${error.value.toString()}.`
      );
    }
    Notifications.add(
      `You can't enable ${funbox.replace(/_/g, " ")}:<br>${errorStrings.join(
        "<br>"
      )}`,
      0,
      {
        duration: 5,
        allowHTML: true,
      }
    );
    return false;
  } else {
    return true;
  }
}
