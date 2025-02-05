/**
 * @module Output
 *
 */
export default interface Interface {
    (Source: string): Promise<string>;
}
