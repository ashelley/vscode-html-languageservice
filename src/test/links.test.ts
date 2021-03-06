
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import {TextDocument} from 'vscode-languageserver-types';
import * as htmlLanguageService from '../htmlLanguageService';
import * as url from 'url'; 

suite('HTML Link Detection', () => {



	function testLinkCreation(modelUrl: string, tokenContent: string, expected: string): void {
		let documentContext : htmlLanguageService.DocumentContext = {
			resolveReference: (ref) => url.resolve(modelUrl, ref)
		}
		let document = TextDocument.create(modelUrl, 'html', 0, `<a href="${tokenContent}">`);
		let ls = htmlLanguageService.getLanguageService();
		let links = ls.findDocumentLinks(document, documentContext);
		assert.equal(links[0] && links[0].target, expected);
	}

	function testLinkDetection(value: string, expectedLinkLocations: number[]): void {
		let document = TextDocument.create('test://test/test.html', 'html', 0, value);
		let documentContext : htmlLanguageService.DocumentContext = {
			resolveReference: (ref) => url.resolve(document.uri, ref)
		}
		let ls = htmlLanguageService.getLanguageService();
		let links = ls.findDocumentLinks(document, documentContext);
		assert.deepEqual(links.map(l => l.range.start.character), expectedLinkLocations);
	}

	test('Link creation', () => {
		testLinkCreation('http://model/1', 'javascript:void;', null);
		testLinkCreation('http://model/1', ' \tjavascript:alert(7);', null);
		testLinkCreation('http://model/1', ' #relative', null);
		testLinkCreation('http://model/1', 'file:///C:\\Alex\\src\\path\\to\\file.txt', 'file:///C:\\Alex\\src\\path\\to\\file.txt');
		testLinkCreation('http://model/1', 'http://www.microsoft.com/', 'http://www.microsoft.com/');
		testLinkCreation('http://model/1', 'https://www.microsoft.com/', 'https://www.microsoft.com/');
		testLinkCreation('http://model/1', '//www.microsoft.com/', 'http://www.microsoft.com/');
		testLinkCreation('http://model/x/1', 'a.js', 'http://model/x/a.js');
		testLinkCreation('http://model/x/1', './a2.js', 'http://model/x/a2.js');
		testLinkCreation('http://model/x/1', '/b.js', 'http://model/b.js');
		testLinkCreation('http://model/x/y/1', '../../c.js', 'http://model/c.js');

		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', 'javascript:void;', null);
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', ' \tjavascript:alert(7);', null);
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', ' #relative', null);
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', 'file:///C:\\Alex\\src\\path\\to\\file.txt', 'file:///C:\\Alex\\src\\path\\to\\file.txt');
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', 'http://www.microsoft.com/', 'http://www.microsoft.com/');
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', 'https://www.microsoft.com/', 'https://www.microsoft.com/');
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', '  //www.microsoft.com/', 'http://www.microsoft.com/');
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', 'a.js', 'file:///C:/Alex/src/path/to/a.js');
		testLinkCreation('file:///C:/Alex/src/path/to/file.txt', '/a.js', 'file:///a.js');

		testLinkCreation('https://www.test.com/path/to/file.txt', 'file:///C:\\Alex\\src\\path\\to\\file.txt', 'file:///C:\\Alex\\src\\path\\to\\file.txt');
		testLinkCreation('https://www.test.com/path/to/file.txt', '//www.microsoft.com/', 'https://www.microsoft.com/');
		testLinkCreation('https://www.test.com/path/to/file.txt', '//www.microsoft.com/', 'https://www.microsoft.com/');

		// invalid uris are ignored
		testLinkCreation('https://www.test.com/path/to/file.txt', '%', null);

		// Bug #18314: Ctrl + Click does not open existing file if folder's name starts with 'c' character
		testLinkCreation('file:///c:/Alex/working_dir/18314-link-detection/test.html', '/class/class.js', 'file:///class/class.js');
	});

	test('Link detection', () => {
		testLinkDetection('<img src="foo.png">', [10]);
		testLinkDetection('<a href="http://server/foo.html">', [9]);
		testLinkDetection('<img src="">', []);
		testLinkDetection('<LINK HREF="a.html">', [12]);
		testLinkDetection('<LINK HREF="a.html\n>\n', []);
	});

});