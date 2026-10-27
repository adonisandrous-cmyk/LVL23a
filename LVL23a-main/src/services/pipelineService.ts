import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export interface DocumentPopulationRequest {
  templateId: string; // e.g. "FL-300"
  dataPayload?: Record<string, any>;
  customMapping?: Record<string, any>;
}

export interface DocumentPopulationResult {
  status: "success" | "error";
  template: string;
  outputPath?: string;
  downloadUrl?: string;
  totalRules: number;
  populatedFields: number;
  skippedFields: number;
  populatedSample: string[];
  error?: string;
}

export async function runUniversalPopulation(
  req: DocumentPopulationRequest
): Promise<DocumentPopulationResult> {
  const rootDir = process.cwd();
  const engineScript = path.join(rootDir, "pipeline", "universal_engine.py");
  const templatePath = path.join(rootDir, "pipeline", "templates", `${req.templateId}.pdf`);
  const defaultMappingPath = path.join(rootDir, "pipeline", "mappings", `${req.templateId}.mapping.json`);
  const defaultDataPath = path.join(rootDir, "pipeline", "master_data_payload.json");
  const outputFilename = `${req.templateId}-Populated-${Date.now()}.pdf`;
  const outputPath = path.join(rootDir, "pipeline", "output", outputFilename);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  // Handle custom data payload if provided
  let dataFilePath = defaultDataPath;
  if (req.dataPayload) {
    const tempTempDataPath = path.join(rootDir, "pipeline", "output", `payload-${Date.now()}.json`);
    fs.writeFileSync(tempTempDataPath, JSON.stringify(req.dataPayload, null, 2));
    dataFilePath = tempTempDataPath;
  }

  // Handle custom mapping dictionary if provided
  let mappingFilePath = defaultMappingPath;
  if (req.customMapping) {
    const tempMappingPath = path.join(rootDir, "pipeline", "output", `mapping-${Date.now()}.json`);
    fs.writeFileSync(tempMappingPath, JSON.stringify(req.customMapping, null, 2));
    mappingFilePath = tempMappingPath;
  }

  if (!fs.existsSync(mappingFilePath)) {
    throw new Error(`Mapping dictionary not found: ${mappingFilePath}`);
  }

  const cmd = `python3 "${engineScript}" "${templatePath}" "${dataFilePath}" "${mappingFilePath}" "${outputPath}"`;
  const { stdout, stderr } = await execAsync(cmd);

  try {
    const result = JSON.parse(stdout.trim());
    return {
      status: "success",
      template: result.template,
      outputPath,
      downloadUrl: `/api/pipeline/download/${outputFilename}`,
      totalRules: result.total_rules,
      populatedFields: result.populated_fields,
      skippedFields: result.skipped_fields,
      populatedSample: result.populated_sample || []
    };
  } catch (err: any) {
    throw new Error(`Engine execution failed: ${stderr || stdout || err.message}`);
  }
}
