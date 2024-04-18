#!/bin/zsh

node index.js $1

# Replace non-breaking space with actual space
sed -i '' 's/\xC2\xA0/ /g' $1


# Replace type: 'date' with expandedTypes.date
sed -i '' "s/type: 'date'/...expandedTypes.date/g" $1

# Replace type: 'date-time' with expandedTypes.date
sed -i '' "s/type: 'datetime'/...expandedTypes.dateTime/g" $1
