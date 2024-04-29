import fs from "fs";
import {SchemaObject} from "../types/types";

export class Exporter{
    public static export(inputSpec: SchemaObject, fileName: string){
        fs.writeFile(`export/${fileName}.txt`, JSON.stringify(inputSpec, null, 2)
                .replace(/"([^"]+)":/g, '$1:')
                .replace(/"/g, '\'')
                .replace('\u00A0', ' ')
            , (err: NodeJS.ErrnoException | null) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
    }

}