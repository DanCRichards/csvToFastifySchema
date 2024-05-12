import {Importer} from "./Importer/Importer";
import {InputMapping} from "./types/types";
import {InputOutputProcessor} from "./InputOutputProcessor/InputOutputProcessor";
import {Exporter} from "./Exporter/Exporter";

const fs = require('fs');


export const csvMapping: InputMapping = {
    apiParentField: 6,
    fieldName: 7,
    title: 1,
    mandatory: 2,
    dataType: 3,
    size: 4,
    exampleData: 5,
    description: 8,
}


const inputSpecification: any = {
    type: 'object',
    description: '',
    properties: {}
}

const highLevel = async () => {
    const fileName = process.argv[2];
    const fileIngestor = new Importer(fileName);
    await fileIngestor.processFile();
    const inputFile = fileIngestor.getResults();

    const fileProcessor = new InputOutputProcessor(inputFile, csvMapping);

    fileProcessor.processFile();
    const inputSpec = fileProcessor.getInputSpec();
    const outputSpec = fileProcessor.getOutputSpec();


    const isInputOutputTheSame = JSON.stringify(inputSpec) === JSON.stringify(outputSpec);


    // Create a variable export file name based on the input file name
    // Should remove .csv at the end
    // Should also remove the directory prefix at the start

    const exportFileName = fileName.split('/').pop()!.split('.').slice(0, -1).join('.');

    Exporter.export(inputSpec, `input_spec_${exportFileName}`);
    Exporter.export(outputSpec, `output_spec${exportFileName}`);
}

highLevel();
