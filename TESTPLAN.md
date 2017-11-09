# Test Plan for the 57-Perception-Study Addon

## Automated Testing

`npm test` verifies the telemetry payload as expected at firefox startup and add-on installation in a clean profile, then does **optimistic testing** of the *commonest path* though the study for a user

- prove the notification bar ui opens
- *clicking on the left-most button presented*.
- verifying that sent Telemetry is correct.

Code at [./test/functional_test.js].

## Manual / QA TEST Instructions

Assumptions / Thoughts

1.  Please ask if you want  more command-line tools to do this testing.

### BEFORE EACH TEST: INSTALL THE ADDON to a CLEAN (NEW) PROFILE

0.  (create profile:  https://developer.mozilla.org/en-US/Firefox/Multiple_profiles, or via some other method)
1.  In your Firefox profile
2.  `about:debugging` > `install temporary addon`

As an alternative (command line) cli method:

1. `git clone` the directory.
2. `npm install` then `npm run firefox` from the Github (source) directory.


### Note: checking "Correct Pings"

All interactions with the UI create sequences of Telemetry Pings.

All UI `shield-study` `study_state` sequences look like this:

- `enter => install => (one of: "voted" | "notification-x" |  "window-or-fx-closed") => exit`.

(Note: this is complicated to explain, so please ask questions and I will try to write it up better!, see `TELMETRY.md` and EXAMPLE SEQUENCE below.)

### Do these tests.

1.  UI APPEARANCE.  OBSERVE a notification bar with these traits:

    *  Icon is 'heartbeat'
    *  Text is one of 8 selected "questions", such as:  "Do you like Firefox?".  These are listed in [./addon/Config.jsm] as the variable `weightedVariations`.
    *  clickable buttons with labels 'yes | not sure | no'  OR 'no | not sure | yes' (50/50 chance of each)
    *  an `x` button at the right that closes the notice.

    Test fails IF:

    - there is no bar.
    - elements are not correct or are not displayed


2.  UI functionality: VOTE

    Expect:  Click on a 'vote' button (any of: `yes | not sure | no`) has all these effects

    - notice closes
    - addon uninstalls
    - no additional tabs open
    - telemetry pings are 'correct' with this SPECIFIC `study_state` as the ending

        - ending is `voted`
        - 'vote' is correct.

3.  UI functionality: 'X' button

    Click on the 'x' button.

    - notice closes
    - addon uninstalls
    - no additional tabs open
    - telemetry pings are 'correct' with this SPECIFIC ending

      - ending is `notification-x`

4.  UI functionality  'close window'

    1.  Open a 2nd firefox window.
    2.  Close the initial window.

    Then observe:

    - notice closes
    - addon uninstalls
    - no additional tabs open
    - telemetry pings are 'correct' with this SPECIFIC ending

      - ending is `window-or-fx-closed`


---
## Helper code and tips

### ***To open a Chrome privileged console***

1.  `about:addons`
2.  `Tools > web developer console`

Or use other methods, like Scratchpad.


### **Telemetry Ping Printing Helper Code**

```javascript
async function printPings() {
  async function getTelemetryPings (options) {
    // type is String or Array
    const {type, n, timestamp, headersOnly} = options;
    Components.utils.import("resource://gre/modules/TelemetryArchive.jsm");
    // {type, id, timestampCreated}
    let pings = await TelemetryArchive.promiseArchivedPingList();
    if (type) {
      if (!(type instanceof Array)) {
        type = [type];  // Array-ify if it's a string
      }
    }
    if (type) pings = pings.filter(p => type.includes(p.type));
    if (timestamp) pings = pings.filter(p => p.timestampCreated > timestamp);

    pings.sort((a, b) => b.timestampCreated - a.timestampCreated);
    if (n) pings = pings.slice(0, n);
    const pingData = headersOnly ? pings : pings.map(ping => TelemetryArchive.promiseArchivedPingById(ping.id));
    return Promise.all(pingData)
  }
  async function getPings() {
    const ar = ["shield-study", "shield-study-addon"];
    return getTelemetryPings({type: ["shield-study", "shield-study-addon"]});
  }

  const pings = (await getPings()).reverse();
  const p0 = pings[0].payload;
  // print common fields
  console.log(
    `
// common fields

branch        ${p0.branch}        // should describe Question text
study_name    ${p0.study_name}
addon_version ${p0.addon_version}
version       ${p0.version}

    `
  )

  pings.forEach(p=>{
    console.log(p.creationDate, p.payload.type);
    console.log(JSON.stringify(p.payload.data,null,2))
  })
}

printPings()

```


### Example sequence for a 'voted => not sure' interaction

See [TELEMETRY.md](./TELEMETRY.md), EXAMPLE SEQUENCE section at the bottom.
