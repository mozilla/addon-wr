# Test Plan for the Pug Arg Addon

This is for version 1.0.5+

## Manual / QA TEST Instructions

### PREREQUISITES:

    Node 8+ w/ npm 5
    Firefox 57+

### Installation:

    git clone https://github.com/gregglind/addon-wr.git
    cd addon-wr
    npm install


### Invariants:

1.  BUILDABLE and RUNNABLE.  It always builds and runs

    ```
    cd addon
    npm run web-ext-lint
    npm run web-ext-run
    ```

    Lint will have this output:

    ```
    Validation Summary:

    errors          0
    notices         2
    warnings        1
    ```

2.  LINTABLE:  It lints, with **warnings** but **no errors**.

    `npm run eslint`

    Known warnings:

    ```
    /Users/glind/gits/addon-wr/addon/content-script.js
      119:10  warning  Expected a conditional expression and instead saw an assignment  no-cond-assign
      123:11  warning  Expected a conditional expression and instead saw an assignment  no-cond-assign
    ```

## Tests:


1. **Header ALWAYS sends on special sites.**

    Goal: convince that the HEADER `X-1057` will be sent to appropriate pages.

    1. Setup

        - open https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending

    2. Always yes `X_1057` header.
        - refresh https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending
        - Confirm that `X_1057` `true` IS in the list of headers

1. **Header NOT on, for most sites**.

    1.  Setup

        - choose some arbitrary site

    1.  Test:  Observe in `devTools > network` that there is no `X-1057` header.




1. **Omnipresent page modifications**

    Goal:  See that the page modification effect exists IFF the pref is enabled.

    General effect: for specific words like privacy and control, they will appear flipped, then after 2-6 seconds, revert.  A hover box will exist (for another 5 seconds) for each with a link to SUMO.

    Note:  partial matches / subsets of words will also trigger the effect.

    1. Setup

        - open PRIVACYPAGE: `https://www.mozilla.org/en-US/privacy/firefox/`


    1.  See effect

        1. visit or refresh privacy page.
        2. Observe:

            1.  Words such as 'privacy' are upside down.
            2.  Between 2-6 seconds later, they revert
            3.  If you hover on those words (in either flipped or normal state), a tooltip appears, linking to a SUMO page.
