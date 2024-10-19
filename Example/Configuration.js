/**
 * @module Option
 *
 */
export default (await import("../Target/Function/Merge.js")).default((await import("@playform/pipe/Target/Variable/Option.js")).default, {
    Action: {
        Read: async (On) => {
            console.log("Read:");
            console.log(On);
            return On.Buffer;
        },
        Wrote: async (On) => {
            console.log("Wrote:");
            console.log(On);
            return On.Buffer;
        },
    },
});
