import { IBankSMSParser, ParsedBankSMS } from "./base.parser";
import { MehrIranBankParser } from "./mehr-iran.parser";

class BankParserRegistry {
  private parsers: IBankSMSParser[] = [];

  constructor() {
    // Register available bank parsers
    this.register(new MehrIranBankParser());
  }

  public register(parser: IBankSMSParser) {
    this.parsers.push(parser);
  }

  public getParser(sender: string, rawText: string): IBankSMSParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(sender, rawText)) {
        return parser;
      }
    }
    return null;
  }

  public parse(sender: string, rawText: string): ParsedBankSMS {
    const parser = this.getParser(sender, rawText);
    if (!parser) {
      return {
        success: false,
        bankSlug: "unknown",
        isDeposit: false,
        amountRial: BigInt(0),
        amountToman: BigInt(0),
        rawText,
        error: `No compatible bank parser found for sender: ${sender}`,
      };
    }
    return parser.parse(rawText, sender);
  }
}

export const bankParserRegistry = new BankParserRegistry();
export * from "./base.parser";
export * from "./mehr-iran.parser";
