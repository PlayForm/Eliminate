/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import { FileAccess } from '../../base/common/network.js';
import { run as runCli } from './remoteExtensionHostAgentCli.js';
import { createServer as doCreateServer, IServerAPI } from './remoteExtensionHostAgentServer.js';
import { parseArgs, ErrorReporter } from '../../platform/environment/node/argv.js';
import { join, dirname } from '../../base/common/path.js';
import { performance } from 'perf_hooks';
import { serverOptions } from './serverEnvironmentService.js';
import product from '../../platform/product/common/product.js';
import * as perf from '../../base/common/performance.js';
perf.mark('code/server/codeLoaded');
(<any>global).vscodeServerCodeLoadedTime = performance.now();
;
const args = parseArgs(process.argv.slice(2), serverOptions, errorReporter);
const REMOTE_DATA_FOLDER = args['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote');
const USER_DATA_PATH = join(REMOTE_DATA_FOLDER, 'data');
const APP_SETTINGS_HOME = join(USER_DATA_PATH, 'User');
;
;
;
parseArgs(process.argv.slice(2), serverOptions, {
    onMultipleValues: (id: string, usedValue: string) => {
        console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
    },
    onEmptyValue: (id) => {
        console.error(`Ignoring option '${id}': Value must not be empty.`);
    },
    onUnknownOption: (id: string) => {
        console.error(`Ignoring option '${id}': not supported for server.`);
    },
    onDeprecatedOption: (deprecatedOption: string, message) => {
        console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
    }
})['user-data-dir'] =
    join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data');
;
;
parseArgs(process.argv.slice(2), serverOptions, {
    onMultipleValues: (id: string, usedValue: string) => {
        console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
    },
    onEmptyValue: (id) => {
        console.error(`Ignoring option '${id}': Value must not be empty.`);
    },
    onUnknownOption: (id: string) => {
        console.error(`Ignoring option '${id}': not supported for server.`);
    },
    onDeprecatedOption: (deprecatedOption: string, message) => {
        console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
    }
})['builtin-extensions-dir'] =
    join(dirname(FileAccess.asFileUri('').fsPath), 'extensions');
parseArgs(process.argv.slice(2), serverOptions, {
    onMultipleValues: (id: string, usedValue: string) => {
        console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
    },
    onEmptyValue: (id) => {
        console.error(`Ignoring option '${id}': Value must not be empty.`);
    },
    onUnknownOption: (id: string) => {
        console.error(`Ignoring option '${id}': not supported for server.`);
    },
    onDeprecatedOption: (deprecatedOption: string, message) => {
        console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
    }
})['extensions-dir'] = parseArgs(process.argv.slice(2), serverOptions, {
    onMultipleValues: (id: string, usedValue: string) => {
        console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
    },
    onEmptyValue: (id) => {
        console.error(`Ignoring option '${id}': Value must not be empty.`);
    },
    onUnknownOption: (id: string) => {
        console.error(`Ignoring option '${id}': not supported for server.`);
    },
    onDeprecatedOption: (deprecatedOption: string, message) => {
        console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
    }
})['extensions-dir'] || join(parseArgs(process.argv.slice(2), serverOptions, {
    onMultipleValues: (id: string, usedValue: string) => {
        console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
    },
    onEmptyValue: (id) => {
        console.error(`Ignoring option '${id}': Value must not be empty.`);
    },
    onUnknownOption: (id: string) => {
        console.error(`Ignoring option '${id}': not supported for server.`);
    },
    onDeprecatedOption: (deprecatedOption: string, message) => {
        console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
    }
})['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'extensions');
[parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['extensions-dir'], join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data'), join(join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data'), 'User'), join(join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data'), 'Machine'), join(join(join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data'), 'User'), 'globalStorage'), join(join(join(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), 'data'), 'User'), 'History')].forEach(f => {
    try {
        if (!fs.existsSync(f)) {
            fs.mkdirSync(f, { mode: 0o700 });
        }
    }
    catch (err) {
        console.error(err);
    }
});
/**
 * invoked by server-main.js
 */
export function spawnCli() {
    runCli(parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    }), parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'), serverOptions);
}
/**
 * invoked by server-main.js
 */
export function createServer(address: string | net.AddressInfo | null): Promise<IServerAPI> {
    return doCreateServer(address, parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    }), parseArgs(process.argv.slice(2), serverOptions, {
        onMultipleValues: (id: string, usedValue: string) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id: string) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption: string, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    })['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || join(os.homedir(), product.serverDataFolderName || '.vscode-remote'));
}
