declare module 'react-native-papaparse' {
    interface ParseError {
      type: string;
      code: string;
      message: string;
      row: number;
    }
  
    interface ParseMeta {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
    }
  
    interface ParseResult<T> {
      data: T[];
      errors: ParseError[];
      meta: ParseMeta;
    }
  
    interface ParseConfig<T> {
      header?: boolean;
      dynamicTyping?: boolean;
      complete?: (results: ParseResult<T>) => void;
      error?: (error: ParseError) => void;
      download?: boolean;
      // Add other config properties as needed
    }
  
    const Papa = {
      parse: <T>(csvString: string, config: ParseConfig<T>): void => {}
    };
  
    export default Papa;
  }