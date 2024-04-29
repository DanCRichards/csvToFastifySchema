import {Importer} from "./Importer/Importer";
import {InputMapping} from "./types/types";
import {InputOutputProcessor} from "./InputOutputProcessor/InputOutputProcessor";
import {Exporter} from "./Exporter/Exporter";

const fs = require('fs');


const csvMapping: InputMapping = {
    fieldName: 6,
    title: 1,
    mandatory: 2,
    dataType: 3,
    size: 4,
    exampleData: 5,
    description: 7,
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
    Exporter.export(inputSpec, 'newTest');
}

highLevel();
