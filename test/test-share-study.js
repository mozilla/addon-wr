
async function animationTest(driver, url) {
  await utils.addShareButton(driver);
  await utils.gotoURL(driver, url);
  await utils.copyUrlBar(driver);
  await utils.waitForClassAdded(driver);
  const { hasClass, hasColor } = await utils.testAnimation(driver);
  return hasClass && hasColor;
}

async function popupTest(driver, url) {
  await utils.gotoURL(driver, url);
  await utils.copyUrlBar(driver);
  const panelOpened = await utils.testPanel(driver, "share-button-panel");
  return panelOpened;
}

async function overflowMenuTest(driver, test, url) {
  const window = driver.manage().window();
  const currentSize = await window.getSize();
  await window.setSize(640, 480);

  const overflowButton = driver.wait(until.elementLocated(
    By.id("nav-bar-overflow-button")), 1000);
  await overflowButton.click();

  await utils.copyUrlBar(driver);

  assert(!(await test(driver, url)));
  await window.setSize(currentSize.width, currentSize.height);
}

async function setTreatment(driver, treatment) {
  return driver.executeAsyncScript((treatmentArg, callback) => {
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    Preferences.set("extensions.sharebuttonstudy.treatment", treatmentArg);
    callback();
  }, treatment);
}

async function summaryFieldTest(driver, addonId, treatment) {
  await utils.uninstallAddon(driver, addonId);
  // hack workaround to wait for uninstall to really happen?
  await new Promise(resolve => setTimeout(resolve, 1000));
  await setTreatment(driver, treatment);
  // install the addon
  await utils.installAddon(driver);

  if (["highlight", "doorhangerDoNothing"].includes(treatment)) {
    await utils.addShareButton(driver);
  }

  await utils.gotoURL(driver, MOZILLA_ORG);
  await utils.copyUrlBar(driver);
  await utils.waitForAnimationEnd(driver);

  await utils.uninstallAddon(driver, addonId);
  // hacky workaround to wait until the summary ping is sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
  const foundPings = utils.searchTelemetry(
    [ping => Object.hasOwnProperty.call(ping.payload.data.attributes, "summary")],
    pings);
  assert(foundPings.length > 0);

  const summaryPings = JSON.parse(foundPings[0].payload.data.attributes.summary);
  // Event pings do not use the treatment name to avoid confusion between
  // showing the doorhanger vs. showing ask-to-add panel etc. (ie. if the share button
  // is already in the toolbar)
  const treatmentToEventName = {
    highlight: "highlight",
    doorhangerDoNothing: "doorhanger",
    doorhangerAskToAdd: "ask-to-add",
    doorhangerAddToToolbar: "add-to-toolbar",
  };
  const events = [{ event: "copy" }, { treatment: treatmentToEventName[treatment] }];
  // add to toolbar will additionally trigger the doorhanger treatment, since it will
  // add the button to the toolbar every time
  if (treatment === "doorhangerAddToToolbar") {
    events.push({ treatment: "doorhanger" });
  }

  assert(summaryPings.length === events.length);
  for (let i = 0; i < events.length; i++) {
    delete summaryPings[i].timestamp;
    delete summaryPings[i].id;
    assert(events[i][Object.keys(events[i])[0]]
      === summaryPings[i][Object.keys(summaryPings[i])[0]]);
  }
}



describe("Basic Functional Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let addonId;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await setTreatment(driver, "doorHangerAddToToolbar");
    // install the addon
    addonId = await utils.installAddon(driver);
    // add the share-button to the toolbar
    await utils.addShareButton(driver);
  });

  after(async() => driver.quit());

  afterEach(async() => postTestReset(driver));

  it("should have a URL bar", async() => {
    const urlBar = await utils.promiseUrlBar(driver);
    const text = await urlBar.getAttribute("placeholder");
    assert.equal(text, "Search or enter address");
  });

  it("should have a share button", async() => {
    const button = await utils.promiseAddonButton(driver);
    const text = await button.getAttribute("tooltiptext");
    assert.equal(text, "Share this page");
  });

  it("should have copy paste working", async() => {
    // FIXME testText will automatically be treated as a URL
    // which means that it will be formatted and the clipboard
    // value will be different unless we pass in a URL text at
    // the start
    const testText = "about:test";

    // write dummy value just in case testText is already in clipboard
    await clipboardy.write("foobar");
    const urlBar = await utils.promiseUrlBar(driver);
    await urlBar.sendKeys(testText);

    await utils.copyUrlBar(driver);
    const clipboard = await clipboardy.read();
    assert(clipboard === testText);
  });

  it(`should only trigger MAX_TIMES_TO_SHOW = ${MAX_TIMES_TO_SHOW} times`, async() => {
    // NOTE: if this test fails, make sure MAX_TIMES_TO_SHOW has the correct value.

    await utils.gotoURL(driver, MOZILLA_ORG);
    for (let i = 0; i < MAX_TIMES_TO_SHOW; i++) {
      /* eslint-disable no-await-in-loop */
      await utils.copyUrlBar(driver);
      // wait for the animation to end
      await utils.waitForAnimationEnd(driver);
      // close the popup
      await utils.closePanel(driver);
      /* eslint-enable no-await-in-loop */
    }
    // try to open the panel again, this should fail
    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver);
    const { hasClass, hasColor } = await utils.testAnimation(driver);

    assert(!panelOpened && !hasClass && !hasColor);
  });

  // These tests uninstall the addon before and install the addon after.
  // This lets us assume the addon is installed at the start of each test.
  describe("Addon uninstall tests", () => {
    before(async() => utils.uninstallAddon(driver, addonId));

    after(async() => utils.installAddon(driver));

    it("should no longer trigger animation once uninstalled", async() => {
      await utils.copyUrlBar(driver);
      assert(!(await animationTest(driver, MOZILLA_ORG)));
    });

    it("should no longer trigger popup once uninstalled", async() => {
      await utils.copyUrlBar(driver);
      assert(!(await utils.testPanel(driver, "share-button-panel")));
    });

    it("should no longer trigger ask panel once uninstalled", async() => {
      await utils.copyUrlBar(driver);
      assert(!(await utils.testPanel(driver, "share-button-ask-panel")));
    });

    it("should not add the button to the toolbar once uninstalled", async() => {
      await utils.removeShareButton(driver);
      await utils.copyUrlBar(driver);
      const shareButton = await utils.promiseAddonButton(driver);
      assert(!shareButton);
    });
  });
});

describe("Highlight Treatment Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await setTreatment(driver, "highlight");
    // install the addon
    await utils.installAddon(driver);
  });

  after(async() => {
    await driver.quit();
  });

  afterEach(async() => {
    await postTestReset(driver);
    await utils.removeShareButton(driver);
  });

  it("animation should trigger on regular page", async() => {
    await utils.addShareButton(driver);
    assert(await animationTest(driver, MOZILLA_ORG));
  });

  it("animation should not trigger on disabled page", async() => {
    await utils.addShareButton(driver);
    assert(!(await animationTest(driver, "about:blank")));
  });

  it("animation should not trigger if the share button is not added to toolbar", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);

    await utils.copyUrlBar(driver);
    const { hasClass, hasColor } = await utils.testAnimation(driver);
    assert(!hasClass && !hasColor);
  });

  it("should not trigger animation if the share button is in the overflow menu", async() => {
    await utils.addShareButton(driver);
    await overflowMenuTest(driver, animationTest, MOZILLA_ORG);
  });

  it("should send highlight and copy telemetry pings", async() => {
    await utils.addShareButton(driver);
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);
    await utils.waitForClassAdded(driver);

    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry([
      ping => ping.payload.data.attributes.treatment === "highlight",
      ping => ping.payload.data.attributes.event === "copy",
    ], pings);
    assert(foundPings.length > 0);
  });
});

describe("Summary Ping Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;
  let addonId;

  before(async() => {
    driver = await utils.promiseSetupDriver();
  });

  beforeEach(async() => {
    await setTreatment(driver, "highlight");
    // install the addon
    addonId = await utils.installAddon(driver);
  });

  after(async() => {
    await driver.quit();
  });

  afterEach(async() => {
    await postTestReset(driver);
    await utils.removeShareButton(driver);
  });

  it("should set hasShareButton to false if the share button is not added", async() => {
    await utils.uninstallAddon(driver, addonId);
    // hacky workaround to wait until the summary ping is sent
    await new Promise(resolve => setTimeout(resolve, 500));
    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry(
      [ping => Object.hasOwnProperty.call(ping.payload.data.attributes, "summary")],
      pings);
    assert(foundPings.length > 0);
    assert(!JSON.parse(foundPings[0].payload.data.attributes.hasShareButton));
  });

  it("should set hasShareButton to true if the share button is added", async() => {
    await utils.addShareButton(driver);
    await utils.uninstallAddon(driver, addonId);
    // hacky workaround to wait until the summary ping is sent
    await new Promise(resolve => setTimeout(resolve, 500));
    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry(
      [ping => Object.hasOwnProperty.call(ping.payload.data.attributes, "summary")],
      pings);
    assert(foundPings.length > 0);
    assert(JSON.parse(foundPings[0].payload.data.attributes.hasShareButton));
  });

  it("should report the correct number of URL copy events", async() => {
    await utils.copyUrlBar(driver);
    await new Promise(resolve => setTimeout(resolve, 100)); // wait in between copy events
    await utils.copyUrlBar(driver);
    await new Promise(resolve => setTimeout(resolve, 100)); // wait in between copy events
    await utils.copyUrlBar(driver);
    await new Promise(resolve => setTimeout(resolve, 100)); // wait in between copy events
    await utils.uninstallAddon(driver, addonId);
    // hacky workaround to wait until the summary ping is sent
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry(
      [ping => Object.hasOwnProperty.call(ping.payload.data.attributes, "summary")],
      pings);
    assert(foundPings.length > 0);
    const urlBarCopies = JSON.parse(foundPings[0].payload.data.attributes
      .numberOfTimesURLBarCopied);
    assert(urlBarCopies === 3, `Expected 3 urlBarCopies, instead urlBarCopies = ${urlBarCopies}`);
  });

  it("should log a summary ping for highlight treatment", async() => {
    await summaryFieldTest(driver, addonId, "highlight");
  });

  it("should log a summary ping for doorhangerDoNothing treatment", async() => {
    await summaryFieldTest(driver, addonId, "doorhangerDoNothing");
  });

  it("should log a summary ping for doorhangerAskToAdd treatment", async() => {
    await summaryFieldTest(driver, addonId, "doorhangerAskToAdd");
  });

  it("should log a summary ping for doorhangerAddToToolbar treatment", async() => {
    await summaryFieldTest(driver, addonId, "doorhangerAddToToolbar");
  });
});

describe("DoorhangerDoNothing Treatment Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;
  let addonId;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await setTreatment(driver, "doorhangerDoNothing");
    // install the addon
    addonId = await utils.installAddon(driver);
  });

  after(async() => {
    await utils.uninstallAddon(driver, addonId);
    await driver.quit();
  });

  afterEach(async() => {
    await postTestReset(driver);
    await utils.removeShareButton(driver);
  });

  it("popup should trigger on regular page", async() => {
    await utils.addShareButton(driver);
    assert(await popupTest(driver, MOZILLA_ORG));
  });

  it("popup should not trigger on disabled page", async() => {
    await utils.addShareButton(driver);
    await utils.gotoURL(driver, "about:blank");

    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-panel");
    assert(!panelOpened);
    await utils.removeShareButton(driver);
  });

  it("popup should not trigger if the share button is not added to toolbar", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);

    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-panel");
    assert(!panelOpened);
  });

  it("should not trigger doorhanger if the share button is in the overflow menu", async() => {
    await utils.addShareButton(driver);
    await overflowMenuTest(driver, popupTest, MOZILLA_ORG);
  });

  it("should send doorhanger and copy telemetry pings", async() => {
    await utils.addShareButton(driver);
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);
    await utils.testPanel(driver, "share-button-panel");

    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry([
      ping => ping.payload.data.attributes.treatment === "doorhanger",
      ping => ping.payload.data.attributes.event === "copy",
    ], pings);
    assert(foundPings.length > 0);
  });
});

describe("DoorhangerAskToAdd Treatment Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;
  let addonId;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await setTreatment(driver, "doorhangerAskToAdd");
    // install the addon
    addonId = await utils.installAddon(driver);
  });

  after(async() => {
    await utils.uninstallAddon(driver, addonId);
    await driver.quit();
  });

  afterEach(async() => {
    await postTestReset(driver);
    await utils.removeShareButton(driver);
  });

  it("should open an ask panel on a regular page without the share button", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-ask-panel");
    assert(panelOpened);
  });

  it("should open a standard panel on a regular page with the share button", async() => {
    await utils.addShareButton(driver);
    assert(await popupTest(driver, MOZILLA_ORG));
  });

  it("should not open an ask panel on a regular page with the share button", async() => {
    await utils.addShareButton(driver);

    await utils.gotoURL(driver, MOZILLA_ORG);

    await utils.copyUrlBar(driver);
    const askPanelOpened = await utils.testPanel(driver, "share-button-ask-panel");
    assert(!askPanelOpened);
  });

  it("should not open an ask panel on a regular page if the share button is in the overflow menu", async() => {
    await utils.addShareButton(driver);

    const window = driver.manage().window();
    const currentSize = await window.getSize();
    await window.setSize(640, 480);
    await utils.copyUrlBar(driver);
    assert(!await utils.testPanel(driver, "share-button-ask-panel"));
    await window.setSize(currentSize.width, currentSize.height);
  });

  it("should not open an ask panel on a disabled page", async() => {
    await utils.gotoURL(driver, "about:blank");

    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-ask-panel");
    assert(!panelOpened);
  });

  it("should add the button to the toolbar upon clicking on ask panel", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);

    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-ask-panel");
    assert(panelOpened);

    const askPanel = driver.wait(until.elementLocated(
      By.id("share-button-ask-panel")), 1000);
    await askPanel.click();
    assert(await utils.promiseAddonButton(driver));
  });

  it("should not show the ask panel after the button was added once", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);

    const askPanel = driver.wait(until.elementLocated(
      By.id("share-button-ask-panel")), 1000);
    await askPanel.click();
    assert(await utils.promiseAddonButton(driver));

    assert(await utils.removeShareButton(driver));

    await utils.copyUrlBar(driver);
    const panelOpened = await utils.testPanel(driver, "share-button-ask-panel");
    assert(!panelOpened);
  });

  it("should send ask-to-add and copy telemetry pings", async() => {
    await utils.addShareButton(driver);
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);
    await utils.testPanel(driver, "share-button-ask-panel");

    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry([
      ping => ping.payload.data.attributes.treatment === "ask-to-add",
      ping => ping.payload.data.attributes.event === "copy",
    ], pings);
    assert(foundPings.length > 0);
  });
});

describe("DoorhangerAddToToolbar Treatment Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;
  let addonId;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await setTreatment(driver, "doorhangerAddToToolbar");
    // install the addon
    addonId = await utils.installAddon(driver);
  });

  after(async() => {
    await utils.uninstallAddon(driver, addonId);
    await driver.quit();
  });

  afterEach(async() => {
    await postTestReset(driver);
    await utils.removeShareButton(driver);
  });

  it("should add the button to the toolbar upon copy paste on regular page", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);

    await utils.copyUrlBar(driver);
    assert(await utils.promiseAddonButton(driver));
  });

  it("should only add the button to the toolbar once", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);

    assert(await utils.removeShareButton(driver));

    await utils.copyUrlBar(driver);

    const shareButton = await utils.promiseAddonButton(driver);
    assert(shareButton === null);
  });

  it("popup should trigger on regular page", async() => {
    assert(await popupTest(driver, MOZILLA_ORG));
  });

  it("should send add-to-toolbar and copy telemetry pings", async() => {
    await utils.gotoURL(driver, MOZILLA_ORG);
    await utils.copyUrlBar(driver);

    const pings = await utils.getMostRecentPingsByType(driver, "shield-study-addon");
    const foundPings = utils.searchTelemetry([
      ping => ping.payload.data.attributes.treatment === "add-to-toolbar",
      ping => ping.payload.data.attributes.event === "copy",
    ], pings);
    assert(foundPings.length > 0);
  });
});

describe("Expiration date tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    // set expiration date to a date sufficiently in the past to trigger expiration
    const now = new Date(Date.now());
    const expiredDateString = new Date(now.setDate(now.getDate() - 30)).toISOString();
    await driver.executeAsyncScript((dateStringArg, callback) => {
      Components.utils.import("resource://gre/modules/Preferences.jsm");
      Preferences.set("extensions.sharebuttonstudy.expirationDateString", dateStringArg);
      callback();
    }, expiredDateString);
    // install the addon
    await utils.installAddon(driver);
  });

  after(async() => driver.quit());

  it("should open a new tab", async() => {
    const newTabOpened = await driver.wait(async() => {
      const handles = await driver.getAllWindowHandles();
      return handles.length === 2; // opened a new tab
    }, 3000);
    assert(newTabOpened);
  });

  it("should open a new tab to the correct URL", async() => {
    const currentHandle = await driver.getWindowHandle();
    driver.setContext(Context.CONTENT);
    // Find the new window handle.
    let newWindowHandle = null;
    const handles = await driver.getAllWindowHandles();
    for (const handle of handles) {
      if (handle !== currentHandle) {
        newWindowHandle = handle;
      }
    }
    const correctURLOpened = await driver.wait(async() => {
      await driver.switchTo().window(newWindowHandle);
      const currentURL = await driver.getCurrentUrl();
      return currentURL.startsWith("https://qsurvey.mozilla.com/s3/sharing-study");
    });
    assert(correctURLOpened);
  });
});
