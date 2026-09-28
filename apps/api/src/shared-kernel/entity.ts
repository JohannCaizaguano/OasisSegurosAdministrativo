export abstract class Entity<TProps extends { id: string }> {
  protected constructor(protected readonly props: TProps) {}

  get id(): string {
    return this.props.id;
  }

  equals(other: Entity<TProps>): boolean {
    return this.id === other.id;
  }
}
