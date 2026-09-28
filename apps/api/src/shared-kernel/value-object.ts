export abstract class ValueObject<TProps> {
  protected constructor(protected readonly props: Readonly<TProps>) {}

  equals(other: ValueObject<TProps>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  toJSON(): Readonly<TProps> {
    return this.props;
  }

  toString(): string {
    return JSON.stringify(this.props);
  }
}
