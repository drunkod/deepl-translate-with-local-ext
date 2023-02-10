/* eslint-disable @typescript-eslint/naming-convention */
// import axios from 'axios';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
// import querystring from 'query-string';

import { workspace } from 'vscode';
import { ITranslate } from 'comment-translate-manager';

//константа, содержащая префикс конфигурации для deeplTranslate
const PREFIXCONFIG = 'deeplTranslate';

//Карта, содержащая сопоставление языков между vscode и DeepL
const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);

//вспомогательная функция для преобразования кода языка в формат, поддерживаемый DeepL
function convertLang(src: string) {
    //проверяем, присутствует ли исходный язык в langMaps
    if (langMaps.has(src)) {
        //возвращаем отображаемое значение для языка
        return langMaps.get(src);
    }
    //вернуть исходный язык в верхнем регистре
    return src.toLocaleUpperCase();
}

//вспомогательная функция для получения значения конфигурации
export function getConfig<T>(key: string): T | undefined {
    //получаем объект конфигурации для deeplTranslate
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    //возвращаем значение для данного ключа
    return configuration.get<T>(key);
}

//тип для параметра saveFormatting
export type DeepLPreserveFormatting = '0' | '1';
//тип для параметра формальности
export type DeepLFormality = "default" | "more" | "less";

export type DeepLPathToExtention = "/home/alex/Загрузки/cofdbpoegempjloogbagkncekinflcnj/node.js";

export type notify = false;

export type sourceLang = 'en';

export interface ITranslateOptions {
  from?: string;
  to: string;
  sourceLang?: string;
  notify?: boolean;

}

//интерфейс для параметров, переданных в DeepLTranslate
interface DeepLTranslateOption {
    //флаг, указывающий, используется ли бесплатный API
    apiFree?: boolean;
    //ключ аутентификации, необходимый для доступа к DeepL API
    authKey?: string;
    //флаг, указывающий, следует ли сохранять форматирование в переведенном тексте
    preserveFormatting?: DeepLPreserveFormatting;
    //уровень формальности переведенного текста
    formality?: DeepLFormality;
    PathToExtention?: DeepLPathToExtention;
}

//интерфейс для ответа, полученного от DeepL API
interface Response {
    translations: {
        //обнаружен исходный язык
        'detected_source_language': string;
        //переведенный текст
        text: string;
    }[];
}

//реализация интерфейса ITranslate для DeepL
export class DeepLTranslate implements ITranslate {
    //свойство для получения максимальной длины текста, который можно перевести
    get maxLen(): number {
        return 3000;
    }

    //параметры по умолчанию для класса DeepLTranslate
    private _defaultOption: DeepLTranslateOption;

    //конструктор устанавливает параметры по умолчанию и прослушивает изменения конфигурации
    constructor() {
        this._defaultOption = this.createOption();
        //прослушивание изменений в конфигурации deeplTranslate
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                //обновить параметры по умолчанию, если конфигурация deeplTranslate изменится
                this._defaultOption = this.createOption();
            }
        });
    }

    //метод createOption для создания и возврата объекта опции по умолчанию
    createOption() {
    const defaultOption: DeepLTranslateOption = {
        //получаем значение 'apiFree' из конфигурации
        apiFree: getConfig<boolean>('apiFree'),
        //получаем значение 'authKey' из конфигурации
        authKey: getConfig<string>('authKey'),
        //получаем значение preserveFormatting из конфигурации
      preserveFormatting: getConfig<DeepLPreserveFormatting>(
        'preserveFormatting'
      ),
      //получаем значение 'formality' из конфигурации
      formality: getConfig<DeepLFormality>('formality'),
      PathToExtention: getConfig<DeepLPathToExtention>('PathToExtention'),
    };
    return defaultOption;
  }


  
  //метод перевода для выполнения POST-запроса к DeepL API и возврата переведенного текста
  // async translate(content: string, { to = 'auto' }: ITranslateOptions) {
    // //определяем поддомен на основе значения 'apiFree' в конфигурации
    // const subDomain = this._defaultOption.apiFree ? 'api-free' : 'api';
    // //URL для запроса API
    // const url = `https://${subDomain}.deepl.com/v2/translate`;

    //выдать ошибку, если 'authKey' отсутствует в конфигурации
//   if (!this._defaultOption.authKey) {
//     throw new Error('Please check the configuration of authKey!');
//   }

  //данные для отправки в запросе API
//   const data = {
//     text: content,
//     target_lang: convertLang(to),
//     auth_key: this._defaultOption.authKey,
//     preserve_formatting: this._defaultOption.preserveFormatting,
//     formality: this._defaultOption.formality,
//   };
  // const { stdout } = await execa("node", [
  //   this._defaultOption.PathToExtention,
  //   content,
  //   to
  // ]);

  // //вернуть переведенный текст из ответа API
//   return 'stdout';
// }

async translate(text: string, options: ITranslateOptions) {
  const command = `node ${this._defaultOption.PathToExtention} "${text}" en`;

  try {
    const { stdout, stderr } = await exec(command);
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    return stdout;
  } catch (err) {
    throw new Error(err);
  }
}


  //метод ссылки для создания ссылки DeepL для предоставленного контента и целевого языка
  link(content: string, { to = 'auto' }: ITranslateOptions) {
    let str = `https://www.deepl.com/translator#auto/${convertLang(
      to
    )}/${encodeURIComponent(content)}`;
    return `[DeepL](${str})`;
  }

  //метод isSupported, чтобы проверить, поддерживается ли исходный язык DeepL
  isSupported(src: string) {
    return true;
  }
}