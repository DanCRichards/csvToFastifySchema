import {InputOutputProcessor, StackObject} from './InputOutputProcessor';
import { DefaultSchemaObject, InputMapping, SchemaObject } from "../types/types";
import {Stack} from "../utils/Stack";
import {csvMapping} from "../main";

describe('InputOutputProcessor', () => {
    let processor: InputOutputProcessor;
    let results: string[][];
    let mapping: InputMapping;

    beforeEach(() => {
        // Initialize your results and mapping here
        results = [];
        mapping = {
            apiParentField: 6,
            fieldName: 7,
            title: 1,
            mandatory: 2,
            dataType: 3,
            size: 4,
            exampleData: 5,
            description: 8,
        };
        processor = new InputOutputProcessor(results, mapping);
        processor.cursorPositionStack.clear();
    });
    test('should initialize correctly', () => {
        expect(processor).toBeInstanceOf(InputOutputProcessor);
    });

    test('shouldRepositionCursorPointerStack - return false when stack is empty', () => {
        const lastParentField = 'root';
        expect(processor.shouldRepositionCursorPointerStack(lastParentField)).toEqual(false);
    });

    test('shouldRepositionCursorPointerStack  return false when top item on stack matches lastParentField', () => {
        const lastParentField = 'root';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        expect(processor.shouldRepositionCursorPointerStack(lastParentField)).toEqual(false);
    });

    test('shouldRepositionCursorPointerStack return false when stack size is 1', () => {
        const lastParentField = 'trains';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        expect(processor.shouldRepositionCursorPointerStack(lastParentField)).toEqual(false);
    });

    test('shouldRepositionCursorPointerStack  return true when top item on stack does not match lastParentField and stack size is greater than 1', () => {
        const lastParentField = 'root';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        processor.cursorPositionStack.push({
            Type: 'array',
            isRoot: false,
            FieldName: 'trains'
        });
        expect(processor.shouldRepositionCursorPointerStack(lastParentField)).toEqual(true);
    });

    test('traverseCursorThroughStack - Can return root array when @ root', () => {
        const cursor = {
            type: 'array',
            items: {
            }
        };
        const stackObject: StackObject = {
            Type: 'object',
            isRoot: true ,
            FieldName: 'root',
        };
        processor.cursorPositionStack.push(stackObject);
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            type: 'array',
            items: {
            }
        };
        expect(result).toEqual(compareObject);

    });


    test('traverseCursorThroughStack - Can return root object when @ root', () => {
        const cursor = {
            type: 'object',
            properties: {
            }
        };
        const stackObject: StackObject = {
            Type: 'object',
            isRoot: true ,
            FieldName: 'root',
        };
        processor.cursorPositionStack.push(stackObject);
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            type: 'object',
            properties: {
            }
        };
        expect(result).toEqual(compareObject);

    });

    test('traverse object - Can go to parent of object 1 deep', () => {
        const cursor = {
            type: 'object',
            properties: {
                train:{
                    type: 'object',
                    properties: {
                    }
                }
            }
        };
        const stackObjects: StackObject[] = [{
            Type: 'object',
            isRoot: true ,
            FieldName: 'root',
        },
            {
                Type: 'object',
                isRoot: false,
                FieldName: 'train'
            }];
        stackObjects.forEach(stackObject => processor.cursorPositionStack.push(stackObject));
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            train:{
                type: 'object',
                properties: {
                }
            }
        };
        expect(result).toEqual(compareObject);
    });

    test('traverse object - Can go to parent of object 2 deep', () => {
        const cursor = {
            type: 'object',
            properties: {
                train:{
                    type: 'object',
                    properties: {
                        containers:{
                            type: 'object',
                            properties: {
                            }
                        }
                    }
                }
            }
        };
        const stackObjects: StackObject[] =
            [
                {
                    Type: 'object',
                    isRoot: true ,
                    FieldName: 'root',
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'train'
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'containers'
                }
            ];
        stackObjects.forEach(stackObject => processor.cursorPositionStack.push(stackObject));
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            containers:{
                type: 'object',
                properties: {
                }
            }
        };
        expect(result).toEqual(compareObject);
    });

    test('traverse object - Can go to parent of object 3 deep', () => {
        const cursor = {
            type: 'object',
            properties: {
                train:{
                    type: 'object',
                    properties: {
                        containers:{
                            type: 'object',
                            properties: {
                                goods:{
                                    type: 'object',
                                    properties:{

                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        const stackObjects: StackObject[] =
            [
                {
                    Type: 'object',
                    isRoot: true ,
                    FieldName: 'root',
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'train'
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'containers'
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'goods'
                }
            ];
        stackObjects.forEach(stackObject => processor.cursorPositionStack.push(stackObject));
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            goods:{
                type: 'object',
                properties: {
                }
            }
        };
        expect(result).toEqual(compareObject);
    });

    test('traverse object - Can go to parent of Array 3 deep', () => {
        const cursor = {
            type: 'array',
            items: {
                train:{
                    type: 'array',
                    items: {
                        containers:{
                            type: 'array',
                            items: {
                                goods:{
                                    type: 'array',
                                    items:{

                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        const stackObjects: StackObject[] =
            [
                {
                    Type: 'array',
                    isRoot: true ,
                    FieldName: 'root',
                },
                {
                    Type: 'array',
                    isRoot: false,
                    FieldName: 'train'
                },
                {
                    Type: 'array',
                    isRoot: false,
                    FieldName: 'containers'
                },
                {
                    Type: 'array',
                    isRoot: false,
                    FieldName: 'goods'
                }
            ];
        stackObjects.forEach(stackObject => processor.cursorPositionStack.push(stackObject));
        const result = processor.traverseCursorThroughStack(cursor);

        const compareObject = {
            goods:{
                type: 'array',
                items: {
                }
            }
        };
        expect(result).toEqual(compareObject);
    });

    test('traverse object - Can go to parent of a complex object', () => {
        const cursor = {
            type: 'object',
            properties: {
                trains:{
                    type: 'array',
                    items: {
                        train:{
                            type: 'object',
                            properties: {
                                containers:{
                                    type: 'array',
                                    items:{
                                        container:{
                                            type:'object',
                                            properties:{

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        const stackObjects: StackObject[] =
            [
                {
                    Type: 'object',
                    isRoot: true ,
                    FieldName: 'root',
                },
                {
                    Type: 'array',
                    isRoot: false,
                    FieldName: 'trains'
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'train'
                },
                {
                    Type: 'array',
                    isRoot: false,
                    FieldName: 'containers'
                },
                {
                    Type: 'object',
                    isRoot: false,
                    FieldName: 'container'
                }
            ];
        stackObjects.forEach(stackObject => processor.cursorPositionStack.push(stackObject));
        const result = processor.traverseCursorThroughStack(cursor);

        const stack = [
            {
                Type: 'object',
                isRoot: true ,
                FieldName: 'root',
            },
            {
                Type: 'array',
                isRoot: false,
                FieldName: 'trains'
            },
            {
                Type: 'object',
                isRoot: false,
                FieldName: 'train'
            },
            {
                Type: 'array',
                isRoot: false,
                FieldName: 'containers'
            },
            {
                Type: 'object',
                isRoot: false,
                FieldName: 'container'
            }
        ]

        const compareObject = {
            container:{
                type: 'object',
                properties: {
                }
            }
        };
        expect(result).toEqual(compareObject);
    });


    test('assignFieldToCursor - Can assign normal field to root', () => {
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        const cursor = {
            type: 'object',
                properties: {
            }
        }
        const insertObject = {
                type: 'number'
        }
        const fieldName = 'count';
        const response = processor.insertObjectAtCursorPosition(cursor, fieldName, insertObject);
        const compareObject = {
            type: 'object',
            properties: {
                count:{
                    type: 'number'
                }
            }
        }
       expect(response).toEqual(compareObject);
    });

    test('assignFieldToCursor - Can assign array field to root', () => {
        const stackItems: StackObject[] = [
            {
                Type: 'object',
                isRoot: true,
                FieldName: 'root'
            },
        ];
        stackItems.forEach(stackItem => processor.cursorPositionStack.push(stackItem));
        const cursor = {
            type: 'object',
            properties: {
            }
        }
        const insertObject = {
            type: 'array',
            items: {}
        }
        const fieldName = 'trains';
        const response = processor.insertObjectAtCursorPosition(cursor, fieldName, insertObject);
        const compareObject = {
            type: 'object',
            properties: {
                trains:{
                    type: 'array',
                    items:{

                    }
                }
            }
        }
        expect(response).toEqual(compareObject);
    });

    test('assignFieldToCursor - Can object array field to root', () => {
        const stackItems: StackObject[] = [
            {
                Type: 'object',
                isRoot: true,
                FieldName: 'root'
            },
        ];
        stackItems.forEach(stackItem => processor.cursorPositionStack.push(stackItem));
        const cursor = {
            type: 'object',
            properties: {
            }
        }
        const insertObject = {
            type: 'object',
            properties: {}
        }
        const fieldName = 'trains';
        const response = processor.insertObjectAtCursorPosition(cursor, fieldName, insertObject);
        const compareObject = {
            type: 'object',
            properties: {
                trains:{
                    type: 'object',
                    properties:{
                    }
                }
            }
        }
        expect(response).toEqual(compareObject);
    });

    test('assignFieldToCursor - Can object array field to child object', () => {
        const stackItems: StackObject[] = [
            {
                Type: 'object',
                isRoot: true,
                FieldName: 'root'
            },
            {
                Type: 'array',
                isRoot: false,
                FieldName: 'trains'
            },
        ];
        stackItems.forEach(stackItem => processor.cursorPositionStack.push(stackItem));

        const specification = {
            type: 'object',
            properties: {
                trains:{
                    type: 'array',
                    items:{
                    }
                }
            }
        }
        let cursor = processor.traverseCursorThroughStack(specification);
        const insertObject = {
            type: 'object',
            properties: {}
        }
        const fieldName = 'train';
        const response = processor.insertObjectAtCursorPosition(cursor, fieldName, insertObject);
        const compareObject = {
            type: 'object',
            properties: {
                trains:{
                    type: 'array',
                    items:{
                        train:{
                            type: 'object',
                            properties:{
                            }
                        }
                    }
                }
            }
        }
        expect(specification).toEqual(compareObject);
    });

    test('assignFieldToCursor - Can set object field to child array ', () => {
        const stackItems: StackObject[] = [
            {
                Type: 'object',
                isRoot: true,
                FieldName: 'root'
            },
            {
                Type: 'object',
                isRoot: false,
                FieldName: 'trains'
            },
        ];
        stackItems.forEach(stackItem => processor.cursorPositionStack.push(stackItem));

        const specification = {
            type: 'object',
            properties: {
                trains:{
                    type: 'object',
                    properties:{
                    }
                }
            }
        }
        let cursor = processor.traverseCursorThroughStack(specification);
        const insertObject = {
            type: 'array',
            items: {}
        }
        const fieldName = 'train';
        const response = processor.insertObjectAtCursorPosition(cursor, fieldName, insertObject);
        const compareObject = {
            type: 'object',
            properties: {
                trains:{
                    type: 'object',
                    properties:{
                        train:{
                            type: 'array',
                            items:{
                            }
                        }
                    }
                }
            }
        }
        expect(specification).toEqual(compareObject);
    });





    test('getInputSpec should return a deep copy of DefaultSchemaObject', () => {
        const inputSpec: SchemaObject = processor.getInputSpec();
        expect(inputSpec).toEqual(DefaultSchemaObject);
        expect(inputSpec).not.toBe(DefaultSchemaObject); // Ensure it's a deep copy
    });

    test('getOutputSpec should return a deep copy of DefaultSchemaObject', () => {
        const outputSpec: SchemaObject = processor.getOutputSpec();
        expect(outputSpec).toEqual(DefaultSchemaObject);
        expect(outputSpec).not.toBe(DefaultSchemaObject); // Ensure it's a deep copy
    });

    test('setField - Can set normal field at root level', () => {
        const row = ['milestone_code_chr', 'MILESTONE_CODE', 'Y', 'String', '20', '', '', 'milestoneCode', 'Allocated code for the milestone'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            title: 'BUSINESS_INPUTS.MILESTONE_CODE',
            description: 'Allocated code for the milestone',
            type: 'string',
            };
        processor.insertRowIntoSpecification(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                milestoneCode: {
                    title: 'BUSINESS_INPUTS.MILESTONE_CODE',
                    description: 'Allocated code for the milestone',
                    type: 'string',
                }
            }
        });
    });

    test('setField - Can set multiple normal fields at root level', () => {
        const rows = [
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', '', 'id', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            },
            {
                row: ['dest_rl_code_col', 'DESTINATION_CODE', 'Y', 'String', '12', '', '', 'code', 'The code of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_CODE',
                    description: 'The code of the impacted service',
                    type: 'string'
                }
            }
        ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for(const row of rows){
            processor.insertRowIntoSpecification(row.row, specification, row.inputObject);
        }

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                id:{
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                },
                code:{
                    title: 'BUSINESS_INPUTS.DESTINATION_CODE',
                    description: 'The code of the impacted service',
                    type: 'string'
                }
            }
        });

    });

    test('setField - Can set Array field at root level', () => {
        const row = ['', '', '', 'Array', '', '', '', 'impactedServices', 'The list of impacted services.'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            type: 'array',
            items:{

            }
        };
        processor.insertRowIntoSpecification(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedServices: {
                    type: 'array',
                    items: {

                    },
                }
            }
        });
    });

    test('setField - Can set OBJECT field at root level', () => {
        const row = ['', '', '', 'Object', '', '', '', 'impactedService', 'The object representing the impacted service'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            type: 'object',
            properties:{

            }
        };
        processor.insertRowIntoSpecification(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedService: {
                    type: 'object',
                    properties: {

                    },
                }
            }
        });
    });

    test('setField - Can set OBJECT at root level with children', () => {
        const rows = [
            {
                row: ['', '', '', 'Object', '', '', '', 'impactedService', 'The object representing the impacted service'],
                inputObject:{
                    type: 'object',
                    properties:{
                    }
                }
            },
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', 'impactedService', 'id', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            }
            ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for(const row of rows){
            processor.insertRowIntoSpecification(row.row, specification, row.inputObject);
        }

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedService: {
                    type: 'object',
                    properties: {
                        id:{
                            title: 'BUSINESS_INPUTS.DESTINATION_ID',
                            description: 'The id of the impacted service',
                            type: 'number'
                        }
                    },
                }
            }
        });
    });

    test('setField - Can set Array at root level with children', () => {
        const rows = [
            {
                row: ['', '', '', 'Array', '', '', '', 'impactedServices', 'The array representing the impacted service'],
                inputObject: {
                    type: 'array',
                    items: {}
                }
            },
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', 'impactedServices', '', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            }
        ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for (const row of rows) {
            processor.insertRowIntoSpecification(row.row, specification, row.inputObject, true);
        }

        console.log('Final Specification: ', JSON.stringify(specification));

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedServices: {
                    type: 'array',
                    items: {
                        title: 'BUSINESS_INPUTS.DESTINATION_ID',
                        description: 'The id of the impacted service',
                        type: 'number'
                    },
                }
            }
        });
    });

        test('setField - Can set Array at root level with child object', () => {
            const rows = [
                {
                    row: ['', '', '', 'Array', '', '', '', 'impactedServices', 'The array representing the impacted service'],
                    inputObject: {
                        type: 'array',
                        description: 'The array representing the impacted service',
                        items: {}
                    }
                },
                {
                    row: ['', '', '', 'Object', '', '', 'impactedServices', 'impactedService', 'The impacted Services Object'],
                    inputObject: {
                        description: 'The impacted Services Object',
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', 'impactedServices, impactedService', 'id', 'The id of the impacted service'],
                    inputObject: {
                        title: 'BUSINESS_INPUTS.DESTINATION_ID',
                        description: 'The id of the impacted service',
                        type: 'number'
                    }
                }
            ];
            const specification = structuredClone(DefaultSchemaObject);
            const stackObject = new Stack<StackObject>();
            for (const row of rows) {
                processor.insertRowIntoSpecification(row.row, specification, row.inputObject, true);
            }

            expect(specification).toEqual({
                type: 'object',
                description: '',
                properties: {
                    impactedServices: {
                        type: 'array',
                        description: 'The array representing the impacted service',
                        items: {
                            impactedService:{
                            type: 'object',
                            description: 'The impacted Services Object',
                            properties:{
                                id:{
                                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                                    description: 'The id of the impacted service',
                                    type: 'number'
                                }
                            }
                        }
                        },
                    }
                }
            });
        });
});

describe('repositionCursorPointerStack', () => {
    let processor: InputOutputProcessor;
    let results: string[][];
    let mapping: InputMapping;

    beforeEach(() => {
        // Initialize your results and mapping here
        results = [];
        mapping = {
            apiParentField: 6,
            fieldName: 7,
            title: 1,
            mandatory: 2,
            dataType: 3,
            size: 4,
            exampleData: 5,
            description: 8,
        };
        processor = new InputOutputProcessor(results, mapping);
        processor.cursorPositionStack.clear();
    });

    test('should not reposition when stack is empty', () => {
        const lastParentField = 'root';
        processor.repositionCursorPointerStack(lastParentField);
        expect(processor.cursorPositionStack.size()).toEqual(0);
    });

    test('should not reposition when top item on stack matches lastParentField', () => {
        const lastParentField = 'root';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        processor.repositionCursorPointerStack(lastParentField);
        expect(processor.cursorPositionStack.size()).toEqual(1);
    });

    test('should reposition when top item on stack does not match lastParentField', () => {
        const lastParentField = 'root';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        processor.cursorPositionStack.push({
            Type: 'array',
            isRoot: false,
            FieldName: 'trains'
        });
        processor.repositionCursorPointerStack(lastParentField);
        expect(processor.cursorPositionStack.size()).toEqual(1);
        expect(processor.cursorPositionStack.peek()?.FieldName).toEqual('root');
    });

    test('should reposition to correct parent field when multiple items on stack', () => {
        const lastParentField = 'trains';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        processor.cursorPositionStack.push({
            Type: 'array',
            isRoot: false,
            FieldName: 'trains'
        });
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: false,
            FieldName: 'train'
        });
        processor.repositionCursorPointerStack(lastParentField);
        expect(processor.cursorPositionStack.size()).toEqual(2);
        expect(processor.cursorPositionStack.peek()?.FieldName).toEqual('trains');
    });

    test.skip('should reposition to correct parent field when multiple items on stack with same name', () => {
        const lastParentField = 'trains';
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: true,
            FieldName: 'root'
        });
        processor.cursorPositionStack.push({
            Type: 'array',
            isRoot: false,
            FieldName: 'trains'
        });
        processor.cursorPositionStack.push({
            Type: 'object',
            isRoot: false,
            FieldName: 'trains'
        });
        processor.repositionCursorPointerStack(lastParentField);
        expect(processor.cursorPositionStack.size()).toEqual(2);
        expect(processor.cursorPositionStack.peek()?.FieldName).toEqual('trains');
    });
});
