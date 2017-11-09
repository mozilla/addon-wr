Surviving on shield island

You are a wizened and skillful dev.  Perhaps you have built a 99.99% uptime website serving millions of users, or you built the firefox awesomebar.... but can you SURVIVE SHIELD ISLAND?

> Inventory

- Firefox nightly, firefox beta, firefox (release)
- npm
- git / github
- shield-studies-addon-utils (studyUtils.jsm)


> Look

DARK CLOUDS block the sun.

On the beach is a HANDBOOK here.

There are TELEMETRY PROBES here.

There is a DEVELOPMENT ENVIROMENT here.

> put on shield-study-addon-utils

StudyUtils.jsm worn.

You feel optimistic, despite the long odds of survival.

You can:
- TELEMETRY: send well-formatted probes
- SETVARIATION:  use the studyName and Telemetry client to consistently and determistically to assign the client to a particular branch

(see TODO)

> use studyUtils to set variation

>





> examine dark clouds

As you look up, a light rain starts to fall.  You wonder how you will make a fire to keep warm, as your clothes start to soak.  The first chills of hypothermia ripple your flesh.

Legacy addon development has challenges.


> examine handbook.

(taking handbook)

SURVIVAL IN HARD ENVIROMENTS

by Lief Savor

Remember that your SURVIVAL GOAL is to...

Get DATA to Telemetry
About user actions
so that you can make decisions about WHICH APPROACH.


## Telemetry First Development

Everything in a SHIELD STUDY leads to allowing ANALYSTS to get data quickly, reliably, and consistently so that they can do analysis of this form:

- for Which VARIATION of a feature
- did users 'do best'.

Your SHIELD-STUDY Legacy Addon is a DELIVERY MECHANISM to collect that data.


An example analysis table

An exmple telemetry `shield-study-addon` probe that contributes to that.

Here is the SQL.


## An EMPTY STUDY.

> use flint and steel to make fire

## Do I



## But I like making User Interface?

Don't we all?!  Mocks are fun!  Styling is fun!

starting with Telemetry makes soe of the... unexpected decisions make sense.

## Wait, did you say legacy addon?

Yes.  Web Extensions CAN'T SEND TELEMETRY.  We need Firefox (chrome) privileges to access the `TelemetryController.jsm`.  That meanss

> make webExtension

Good idea, for some UI's.

## But I have been buildling UI in pure Legacy Extensions since Firefox 2.

Awesome work!  Firebug was awesome.  You have no further use of this guide, and should go to [TODO:Shield-Studies-Addon-Utils-api.md].

## Tools and inventory

### > x template

We have a template folder at TODO:template.  The files are...

The template shows an EMBEDDED WEB EXTENSION with
- build scripts

```
the file tree
```

## Part 1, instrumenting buttons in an embedded web extension.


### Action and Probes

Pretend story:  which of several buttons is the most compelling to firefox users.

Good news:  probes are mostly plain-old-javascrpt-objects.

Back news, getting


### side-by-side deployment

### building 2 buttons.

This part is EASY using the webExtension

`manifest.json`

Getting the probes to firefox



"At least both branches are equally bad":  A plea for experimental controls


FInding shelter

Send message / signal mirror / telemetry?


> go woods

A monkey appears.  It is curious about you

(Helper addon for QA telemetry)




## Full List of All Shield Telemetry Spoilers




## Shield Study Utils Api






