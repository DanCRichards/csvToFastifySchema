

// read the testFiles/exampleSpec.csv
const fs = require('fs');
const csv = require('csv-parser');


const fileName = process.argv[2];

let results = [];

const fileStream = fs.createReadStream(fileName);

const inputSpecification = {
    type: 'object',
    description: '',
    properties: {

    }
}

const csvMapping = {
    fieldName: '6',
    title: '1',
    mandatory: '2',
    dataType: '3',
    size: '4',
    exampleData: '5',
    description: '7',
}


const processFile = (results) => {

    let processingInput = false;
    let rowCounter = 0;

    const inputSpec = {...inputSpecification}
    const mandatoryField = [];

    for(let i = 0; i < results.length; i++) {
        // skip the header
        if( results[i]['0'] === '\nINPUTS' ) {
            processingInput = true;
            rowCounter = 0;
            continue;
        }
        // stop processing when we reach the OUTPUTS section
        if (results[i]['0'] === '\nOUTPUTS') {
            break;
        }
        // skip empty rows
        if(results[i][csvMapping.fieldName] === '' ) {
            continue;
        }

        if(!processingInput){
            continue;
        }
        rowCounter++;

        if (rowCounter < 3){
            continue;
        }

        const type = results[i][csvMapping.dataType].toLowerCase();
        const size = results[i][csvMapping.size];

        if(type.includes('array')){
            const fieldName = results[i][csvMapping.fieldName].split('[')[0];
            const subType = type.split('[')[1].split(']')[0];
            inputSpec.properties[fieldName] = {
                type: 'array',
                items:{
                    title: `BUSINESS_INPUTS.${results[i][csvMapping.title]}`,
                    description: results[i][csvMapping.description],
                    type: subType.toLowerCase(),
                }
            }
        } else{
            inputSpec.properties[results[i][csvMapping.fieldName]] = {
                title: `BUSINESS_INPUTS.${results[i][csvMapping.title]}`,
                description: results[i][csvMapping.description],
                type: type,
            }

            if (results[i][csvMapping.exampleData] !== ''){
                inputSpec.properties[results[i][csvMapping.fieldName]]['examples'] = [results[i][csvMapping.exampleData]]
            }

            if(results[i][csvMapping.mandatory] === 'Y') {
                mandatoryField.push(results[i][csvMapping.fieldName]);
            }
        }


        if(size === ''){
            continue;
        }

        switch(type) {
            case 'string':
                try{
                    inputSpec.properties[results[i][csvMapping.fieldName]]['maxLength'] = parseInt(size);
                }
                catch (e) {
                    throw new Error(`Error processing row ${i}. Cannot pass size as int. apiFieldName: ${results[i][csvMapping.fieldName]}`);
                }
                break;
            case 'number':
            case 'integer':
                if(size.includes(',')){
                    break;
                }
                inputSpec.properties[results[i][csvMapping.fieldName]]['maximum'] = `maxByDigits(${results[i][csvMapping.size]})`;
                break;
                case 'boolean':
                    inputSpec.properties[results[i][csvMapping.fieldName]]['examples'] = [true, false];
                    break;
            default:
                break;
        }


    }

    inputSpec['required'] = [...mandatoryField];

    fs.writeFile('export/inputSpec.txt', JSON.stringify(inputSpec, null, 2)
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/"/g, '\'')
        .replace('\u00A0', ' ')
        , (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });

}



fileStream
    .pipe(csv({newline:'\r\n', headers: false}))
    .on('data', (data) => {
        // 'data' event handler is triggered for each row in the CSV file
        results.push(data);
    })
    .on('end', () => {
        processFile(results);
    })
    .on('error', (err) => {
        // Handle any errors during the stream process
        console.error('An error occurred:', err);
    });
