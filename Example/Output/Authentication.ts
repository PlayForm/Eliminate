/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

class AuthenticationDataRenderer {
	render(manifest: IExtensionManifest): IRenderedData<ITableData> {
		const authentication = manifest.contributes?.authentication || [];
		if (!authentication.length) {
			return { data: { headers: [], rows: [] }, dispose: () => {} };
		}

		const headers = [
			localize("authenticationlabel", "Label"),
			localize("authenticationid", "ID"),
		];

		const rows: IRowData[][] = authentication
			.sort((a, b) => a.label.localeCompare(b.label))
			.map((auth) => {
				return [auth.label, auth.id];
			});

		return {
			data: {
				headers,
				rows,
			},
			dispose: () => {},
		};
	}
}
