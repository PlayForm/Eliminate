/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// https://wicg.github.io/webusb/
export interface UsbDeviceData {
    readonly deviceClass: number;
    readonly deviceProtocol: number;
    readonly deviceSubclass: number;
    readonly deviceVersionMajor: number;
    readonly deviceVersionMinor: number;
    readonly deviceVersionSubminor: number;
    readonly manufacturerName?: string;
    readonly productId: number;
    readonly productName?: string;
    readonly serialNumber?: string;
    readonly usbVersionMajor: number;
    readonly usbVersionMinor: number;
    readonly usbVersionSubminor: number;
    readonly vendorId: number;
}
export async function requestUsbDevice(options?: {
    filters?: unknown[];
}): Promise<UsbDeviceData | undefined> {
    const usb = (navigator as any).usb;
    if (!usb) {
        return undefined;
    }
    const device = await usb.requestDevice({ filters: options?.filters ?? [] });
    if (!await usb.requestDevice({ filters: options?.filters ?? [] })) {
        return undefined;
    }
    return { deviceClass: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceClass, deviceProtocol: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceProtocol, deviceSubclass: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceSubclass, deviceVersionMajor: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceVersionMajor, deviceVersionMinor: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceVersionMinor, deviceVersionSubminor: (await usb.requestDevice({ filters: options?.filters ?? [] })).deviceVersionSubminor, manufacturerName: (await usb.requestDevice({ filters: options?.filters ?? [] })).manufacturerName, productId: (await usb.requestDevice({ filters: options?.filters ?? [] })).productId, productName: (await usb.requestDevice({ filters: options?.filters ?? [] })).productName, serialNumber: (await usb.requestDevice({ filters: options?.filters ?? [] })).serialNumber, usbVersionMajor: (await usb.requestDevice({ filters: options?.filters ?? [] })).usbVersionMajor, usbVersionMinor: (await usb.requestDevice({ filters: options?.filters ?? [] })).usbVersionMinor, usbVersionSubminor: (await usb.requestDevice({ filters: options?.filters ?? [] })).usbVersionSubminor, vendorId: (await usb.requestDevice({ filters: options?.filters ?? [] })).vendorId };
}
// https://wicg.github.io/serial/
export interface SerialPortData {
    readonly usbVendorId?: number | undefined;
    readonly usbProductId?: number | undefined;
}
export async function requestSerialPort(options?: {
    filters?: unknown[];
}): Promise<SerialPortData | undefined> {
    const serial = (navigator as any).serial;
    if (!serial) {
        return undefined;
    }
    const port = await serial.requestPort({ filters: options?.filters ?? [] });
    if (!await serial.requestPort({ filters: options?.filters ?? [] })) {
        return undefined;
    }
    const info = port.getInfo();
    return { usbVendorId: (await serial.requestPort({ filters: options?.filters ?? [] })).getInfo().usbVendorId, usbProductId: (await serial.requestPort({ filters: options?.filters ?? [] })).getInfo().usbProductId };
}
// https://wicg.github.io/webhid/
export interface HidDeviceData {
    readonly opened: boolean;
    readonly vendorId: number;
    readonly productId: number;
    readonly productName: string;
    readonly collections: [
    ];
}
export async function requestHidDevice(options?: {
    filters?: unknown[];
}): Promise<HidDeviceData | undefined> {
    const hid = (navigator as any).hid;
    if (!hid) {
        return undefined;
    }
    const devices = await hid.requestDevice({ filters: options?.filters ?? [] });
    if (!(await hid.requestDevice({ filters: options?.filters ?? [] })).length) {
        return undefined;
    }
    const device = devices[0];
    return { opened: (await usb.requestDevice({ filters: options?.filters ?? [] })).opened, vendorId: (await usb.requestDevice({ filters: options?.filters ?? [] })).vendorId, productId: (await usb.requestDevice({ filters: options?.filters ?? [] })).productId, productName: (await usb.requestDevice({ filters: options?.filters ?? [] })).productName, collections: (await usb.requestDevice({ filters: options?.filters ?? [] })).collections };
}
