# Test Plan for the Pug Arg Addon


## Manual / QA TEST Instructions

### PREREQUISITES:

    Node 8+ w/ npm 5
    Firefox Nightly

### Installation:

    git clone https://github.com/gregglind/addon-wr.git
    cd addon-wr
    npm install


### Tests and Beliefs:

1.  BUILDABLE.  It always builds.

   `npm run build` makes an addon:

    ```
    -rw-r--r--   1 glind  staff     13 Nov  8 15:36 .gitignore
    lrwxr-xr-x   1 glind  staff     43 Dec  8 13:09 linked-addon.xpi@ -> pug.experience@shield.mozilla.org-1.0.0.xpi
    -rw-r--r--   1 glind  staff  21975 Dec  8 13:09 pug.experience@shield.mozilla.org-1.0.0.xpi
    ```

2.  LINTABLE:  It lints, with **warnings** but **no errors**.

    `npm run eslint`


3.  INSTALLABLE:  Full Embedded WebExtension INSTALLS (on nightly)

    `npm run firefox`


4.  (WebExtenion also works)



## Tests:

1. `npm run firefox` (make sure this launches Firefox Nightly until the add-on is signed, at which point you can test on Release, Developer Edition/Aurora, and Nightly).

1. **Preference Exists** (as false)

    - Open `about:config`
    - verify the `extensions.pug.lookingglass` 
    - Boolean config is set to `false`.

1. **Header sending depends on preference**

    Goal: convince that the HEADER `X-1057` will only be sent if the preference is on.  
    

    1. Setup

        - open https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending
        - open `about:config`
        - PREFERENCE:  `extensions.pug.lookingglass`

    1. Preference FALSE :: no `X_1057` header.
        - refresh https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending
        - Confirm that `X_1057` is NOT in the list
        - refresh XHOUSE
        - Confirm that `X_1057` is NOT in the list

    
    2. Preference TRUE :: yes `X_1057` header.
        - set PREFERENCE to `true`
        - refresh https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending
        - Confirm that `X_1057` `true` IS in the list of headers

    3.  Turn off the pref, and confirm headers stop sending.

    Notes: 
    
    1. IFF you are running from `web-ext`, it will behave as though the pref is true.
    2. We don't have a good 'un-test' for showing the header isn't sent *everywhere*.  It's contolled by `addon/webextension/{manifest.json,background.js}`

1. **Omnipresent page modifications**

    Goal:  See that the page modification effect exists IFF the pref is enabled.
    
    General effect: for specific words like privacy and control, they will appear flipped, then after 2-6 seconds, revert.  A hover box will exist for each with a link to SUMO.
    
    Note:  partial matches / subsets of words will also trigger the effect.
    
    1. Setup

        - open `about:config`
        - PREFERENCE:  `extensions.pug.lookingglass`
        - open PRIVACYPAGE: `https://www.mozilla.org/en-US/privacy/firefox/`
    
    1.  With PREFERENCE FALSE
    
        1. visit: https://www.mozilla.org/en-US/privacy/firefox/ has 'modified' "Privacy"
        2. CONFIRM no noticable effects
    
    1.  With PREFERENCE TRUE
    
        1. visit or refresh privacy page.
        2. Observe:

            1.  Words such as 'privacy' are upside down.
            2.  Between 2-6 seconds later, they revert
            3.  If you hover on those words (in either flipped or normal state), a tooltip appears, linking to a SUMO page.
    
    1.  After setting preference to false, effect should disappear.
