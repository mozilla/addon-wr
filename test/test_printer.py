## TODO glind, I believe this file is unused.

import re
import os
import sys

DESCRIBE_REGEX = r'(\s*)\bdescribe'
IT_REGEX = r'(\s*)\bit'
NAME_REGEX = r'"((?:\w+\s?)+)"'

# set script's working directory to the directory containing the script
os.chdir(sys.path[0])
with open("button_test.js") as button_test:
    for line in button_test:
        describe_match = re.search(DESCRIBE_REGEX, line)
        it_match = re.search(IT_REGEX, line)

        if describe_match:
            name_match = re.search(NAME_REGEX, line)
            if name_match:
                print describe_match.group(1) + name_match.group(1)
        elif it_match:
            name_match = re.search(NAME_REGEX, line)
            if name_match:
                print it_match.group(1) + "- " + name_match.group(1)
