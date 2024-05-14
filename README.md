# csvToFastifySchema
A program to convert CSV files to Fastify Schemas


## Author: Dan Richards 

## Purpose: 
To convert CSV files with a specified format to fastify SchemaObjects to allow for quicker code generation of Fastify Schemas. 

> Your team might build API specs in Excel or another spreadsheet document software and a process might require the mapping of those spreadsheets to fastify based APIs. This helps with automating that. 


## Usage:
```npm run start *file location of your input file* ```

## Roadmap: 

- Add validator to the CSV
- Fix issue where outputs using functions are still wrapped in strings
- Add customisable mappings between CSVs and SchemaObject fields 
- Abstract the services
  - This will allow for different input types and mappings between inputs and outputs. 
- Document the code 
- Add a CLI to allow for easier usage




## Bug Reporting 
Feel free to add an issue to this repo. But quite frankly this will likely be a WIP for sometime. 

