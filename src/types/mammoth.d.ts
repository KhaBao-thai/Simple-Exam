declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: any[];
  }
  export interface HtmlResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(input: { arrayBuffer?: ArrayBuffer; path?: string }): Promise<RawTextResult>;
  export function convertToHtml(input: { arrayBuffer?: ArrayBuffer; path?: string }): Promise<HtmlResult>;
  const mammoth: {
    extractRawText: typeof extractRawText;
    convertToHtml: typeof convertToHtml;
  };
  export default mammoth;
}
