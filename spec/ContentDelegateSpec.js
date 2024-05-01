/*global jasmine, DEBUGLEVEL */
describe('The ContentDelegate class', function () {
  // 'tabId' values
  const tabId = 1234;
  // create initial chrome object
  window.chrome = {
    storage: {
      local: {
        get: jasmine.createSpy().and.callFake(function (_, cb) {
          cb({ options: {} });
        }),
        set: jasmine.createSpy('set').and.callFake(function () {}),
        remove: jasmine.createSpy('remove').and.callFake(() => {}),
      },
    },
  };

  // 'path' values
  const districtCourtURI = 'https://ecf.canb.uscourts.gov';
  const singleDocPath = '/doc1/034031424909';
  const docketDisplayPath = '/cgi-bin/DktRpt.pl?101092135737069-L_1_0-1';
  const docketQueryPath = '/cgi-bin/DktRpt.pl?531591';
  const historyDocketPath = '/cgi-bin/HistDocQry.pl?101092135737069-L_1_0-1';

  // 'url' values
  const docketQueryUrl = districtCourtURI.concat(docketQueryPath);
  const docketDisplayUrl = districtCourtURI.concat(docketDisplayPath);
  const singleDocUrl = districtCourtURI.concat(singleDocPath);
  const historyDocketDisplayUrl = districtCourtURI.concat(historyDocketPath);
  const nonsenseUrl = 'http://something.uscourts.gov/foobar/baz';

  const appellateURL = ''; // Todo get good example value
  const appellatePath = ''; // Todo get good example value

  // Smallest possible PDF according to:
  // http://stackoverflow.com/questions/17279712/what-is-the-smallest-possible-valid-pdf
  const pdf_data = '%PDF-1.\ntrailer<</Root<</Pages<</Kids' + '[<</MediaBox[0 0 3 3]>>]>>>>>>\n';

  // 'instances'
  const nonsenseUrlContentDelegate = new ContentDelegate(tabId, nonsenseUrl, []);

  const noPacerCaseIdContentDelegate = new ContentDelegate(
    tabId, // tabId
    docketQueryUrl, // url
    docketQueryPath, // path
    'canb', // court
    undefined, // pacer_case_id
    undefined, // pacer_doc_id
    [] // links
  );

  const docketQueryContentDelegate = new ContentDelegate(
    tabId,
    docketQueryUrl,
    docketQueryPath,
    'canb',
    '531591',
    undefined,
    []
  );
  const docketDisplayContentDelegate = new ContentDelegate(
    tabId,
    docketDisplayUrl,
    docketDisplayPath,
    'canb',
    '531591',
    undefined,
    []
  );
  const historyDocketDisplayContentDelegate = new ContentDelegate(
    tabId,
    historyDocketDisplayUrl,
    docketDisplayPath,
    'canb',
    '531591',
    undefined,
    []
  );
  const appellateContentDelegate = new ContentDelegate(
    tabId,
    appellateURL,
    appellatePath,
    'ca9',
    '1919',
    undefined,
    []
  );
  const singleDocContentDelegate = new ContentDelegate(
    tabId,
    singleDocUrl,
    singleDocPath,
    'canb',
    '531591',
    undefined,
    []
  );
  //TODO
  function setupChromeSpy() {
    window.chrome = {
      extension: { getURL: jasmine.createSpy() },
      storage: {
        local: {
          get: jasmine.createSpy().and.callFake(function (_, cb) {
            cb({ options: {} });
          }),
          set: jasmine.createSpy('set').and.callFake(function () {}),
          remove: jasmine.createSpy('remove').and.callFake(() => {}),
        },
      },
    };
  }

  function clearDocumentBody() {
    document.body.innerHTML = '';
  }

  let nativeFetch;
  beforeEach(function () {
    nativeFetch = window.fetch;
    window.fetch = () =>
      Promise.resolve(new window.Response(new Blob([pdf_data], { type: 'application/pdf' }), { status: 200 }));
    jasmine.Ajax.install();
    setupChromeSpy();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    window.fetch = nativeFetch;
  });

  describe('ContentDelegate constructor', function () {
    const expected_url = 'https://ecf.canb.uscourts.gov/cgi-bin/DktRpt.pl?531591';
    const restricted_url = 'https://ecf.canb.uscourts.gov/doc1/04503837920';
    const expected_path = '/cgi-bin/DktRpt.pl?531591';
    const expected_court = 'canb';
    const expected_pacer_case_id = '531591';
    const expected_pacer_doc_id = '127015406472';
    const link_0 = document.createElement('a');
    link_0.href = 'http://foo/bar/0';
    const link_1 = document.createElement('a');
    link_1.href = 'http://foo/bar/1';
    const expected_links = [link_0, link_1];
    const expected_tabId = 1234;

    it('gets created with necessary arguments', function () {
      const cd = new ContentDelegate(
        tabId,
        expected_url,
        expected_path,
        expected_court,
        expected_pacer_case_id,
        expected_pacer_doc_id,
        expected_links
      );
      expect(cd.tabId).toBe(expected_tabId);
      expect(cd.url).toBe(expected_url);
      expect(cd.path).toBe(expected_path);
      expect(cd.court).toBe(expected_court);
      expect(cd.pacer_case_id).toBe(expected_pacer_case_id);
      expect(cd.pacer_doc_id).toBe(expected_pacer_doc_id);
      expect(cd.links).toEqual(expected_links);
      expect(cd.restricted).toBe(false);
    });

    it('should flag restriction for Warning!', function () {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.value = 'View Document';
      form.appendChild(input);
      document.body.appendChild(form);

      const table = document.createElement('table');
      const table_tr = document.createElement('tr');
      const table_td = document.createElement('td');
      table.appendChild(table_tr);
      table_tr.appendChild(table_td);
      document.body.appendChild(table);
      table_td.textContent = 'Warning! Image';

      expect(document.body.innerText).not.toContain('will not be uploaded');
      const cd = new ContentDelegate(
        tabId,
        restricted_url,
        expected_path,
        expected_court,
        expected_pacer_case_id,
        expected_pacer_doc_id,
        expected_links
      );
      expect(cd.restricted).toBe(true);
      expect(document.body.innerText).toContain('will not be uploaded');
      table.remove();
      form.remove();
    });

    it('should flag restriction for bold restriction', function () {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.value = 'View Document';
      form.appendChild(input);
      document.body.appendChild(form);

      const table_td = document.createElement('td');
      document.body.appendChild(table_td);
      table_td.textContent = 'Image';

      const paragraph = document.createElement('p');
      const bold = document.createElement('b');
      paragraph.appendChild(bold);
      document.body.appendChild(paragraph);
      bold.textContent = 'SEALED';

      expect(document.body.innerText).not.toContain('will not be uploaded');
      const cd = new ContentDelegate(
        tabId,
        restricted_url,
        expected_path,
        expected_court,
        expected_pacer_case_id,
        expected_pacer_doc_id,
        expected_links
      );
      expect(cd.restricted).toBe(true);
      expect(document.body.innerText).toContain('will not be uploaded');
      paragraph.remove();
      form.remove();
    });
  });

  describe('handleDocketQueryUrl', function () {
    let form;
    beforeEach(function () {
      clearDocumentBody();
      form = document.createElement('form');

      dateToField = document.createElement('input');
      dateToField.setAttribute('name', 'date_to');
      document.body.appendChild(dateToField);

      document.body.appendChild(form);
      document.querySelector = jasmine
        .createSpy('querySelector')
        .and.callFake((id) => (document.querySelectorAll(id).length ? document.querySelectorAll(id)[0] : null));
    });

    afterEach(function () {
      form.remove();
    });

    it('has no effect when not on a docket query url', function () {
      const cd = nonsenseUrlContentDelegate;
      spyOn(PACER, 'hasPacerCookie');
      spyOn(PACER, 'isDocketQueryUrl').and.returnValue(false);
      cd.handleDocketQueryUrl();
      expect(PACER.hasPacerCookie).not.toHaveBeenCalled();
    });

    it('handles zero results from getAvailabilityForDocket', function () {
      const cd = docketQueryContentDelegate;
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      cd.handleDocketQueryUrl();
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'application/json',
        responseText: '{"count": 0, "results": []}',
      });
      expect(form.innerHTML).toBe('');
    });

    it('inserts the RECAP banner on an appropriate page', function () {
      const cd = docketQueryContentDelegate;
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      cd.handleDocketQueryUrl();
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'application/json',
        responseText:
          '{"count": 1,' +
          '"results": [{' +
          '"date_modified": "04/16/15",' +
          '"absolute_url": "/download/gov.uscourts.canb.531591/gov.uscourts.canb.531591.docket.html",' +
          '"date_last_filing": "2015-04-20"' +
          '}]}',
      });
      const banner = document.querySelectorAll('.recap-banner')[0];
      expect(banner).not.toBeNull();
      expect(banner.innerHTML).toContain('04/16/15');
      const link = banner.querySelector('a');
      expect(link).not.toBeNull();
      expect(link.href).toBe(
        'https://www.courtlistener.com/download/gov.uscourts.' + 'canb.531591/gov.uscourts.canb.531591.docket.html'
      );
      const autofill = document.querySelector('.recap-filing-button');
      expect(autofill).not.toBeNull();
      expect(autofill.dataset.dateFrom).toBe('04/20/2015')
    });

    it("don't inserts the autofill button when a docket don't have last_filing", function () {
      const cd = docketQueryContentDelegate;
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      cd.handleDocketQueryUrl();
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'application/json',
        responseText: '{"count": 1,' +
        '"results": [{' +
        '"date_modified": "04/16/15",' +
        '"absolute_url": "/download/gov.uscourts.canb.531591/gov.uscourts.canb.531591.docket.html",' +
        '"date_last_filing": null' +
        '}]}',
      });
      const banner = document.querySelectorAll('.recap-banner')[0];
      expect(banner).not.toBeNull();
      const autofill = document.querySelector('.recap-filing-button');
      expect(autofill).toBeNull();
    });

    it('has no effect when on a docket query that has no RECAP', function () {
      const cd = docketQueryContentDelegate;
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      cd.handleDocketQueryUrl();
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'application/json',
        responseText: '{}',
      });
      const banner = document.querySelector('.recap-banner');
      expect(banner).toBeNull();
    });
  });

  describe('handleDocketDisplayPage', function () {
    describe('option disabled', function () {
      beforeEach(function () {
        clearDocumentBody();
        table = document.createElement('table');
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        tbody.appendChild(tr);
        table.appendChild(tbody);
        document.body.appendChild(table);
        window.chrome = {
          extension: {
            getURL: jasmine.createSpy(),
          },
          storage: {
            local: {
              get: jasmine.createSpy().and.callFake((_, cb) => {
                cb({
                  ['1234']: { caseId: '531591' },
                  options: { recap_enabled: false },
                });
              }),
              set: jasmine.createSpy('set').and.callFake(function () {}),
            },
          },
        };
        document.querySelector = jasmine
          .createSpy('querySelector')
          .and.callFake((id) => (document.querySelectorAll(id).length ? document.querySelectorAll(id)[0] : null));
        document.getElementById = jasmine
          .createSpy('getElementById')
          .and.callFake((id) => document.querySelectorAll(`#${id}`)[0]);
      });

      it('has no effect when recap_enabled option is false', function () {
        const cd = docketDisplayContentDelegate;
        spyOn(cd.recap, 'uploadDocket');
        cd.handleDocketDisplayPage();
        expect(cd.recap.uploadDocket).not.toHaveBeenCalled();
      });
    });

    describe('option enabled', function () {
      beforeEach(function () {
        window.chrome = {
          extension: { getURL: jasmine.createSpy('gerURL') },
          storage: {
            local: {
              get: jasmine.createSpy().and.callFake((_, cb) => {
                cb({
                  [1234]: { caseId: '531591' },
                  options: { recap_enabled: true },
                });
              }),
              set: jasmine.createSpy('set').and.callFake(function () {}),
            },
          },
        };
        document.querySelector = jasmine
          .createSpy('querySelector')
          .and.callFake((id) => (document.querySelectorAll(id).length ? document.querySelectorAll(id)[0] : null));
        document.getElementById = jasmine
          .createSpy('getElementById')
          .and.callFake((id) => document.querySelectorAll(`#${id}`)[0]);
      });

      describe('has no effect', function () {
        beforeEach(function () {
          clearDocumentBody();
          table = document.createElement('table');
          const tbody = document.createElement('tbody');
          const tr = document.createElement('tr');
          tbody.appendChild(tr);
          table.appendChild(tbody);
          document.body.appendChild(table);
          window.chrome = {
            extension: { getURL: jasmine.createSpy('gerURL') },
            storage: {
              local: {
                get: jasmine.createSpy().and.callFake((_, cb) => {
                  cb({
                    [1234]: { caseId: '531591' },
                    options: { recap_enabled: true },
                  });
                }),
                set: jasmine.createSpy('set').and.callFake(function () {}),
              },
            },
          };
        });

        it('when not on a docket display url', function () {
          const cd = nonsenseUrlContentDelegate;
          spyOn(cd.recap, 'uploadDocket');
          cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).not.toHaveBeenCalled();
        });

        it('when there is no casenum', function () {
          const cd = new ContentDelegate(tabId, docketDisplayUrl, undefined, 'canb', undefined, undefined, []);
          spyOn(cd.recap, 'uploadDocket');
          cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).not.toHaveBeenCalled();
        });
      });

      describe('when the history state is already set', function () {
        beforeEach(function () {
          clearDocumentBody();
          table = document.createElement('table');
          const tbody = document.createElement('tbody');
          const tr = document.createElement('tr');
          tbody.appendChild(tr);
          table.appendChild(tbody);
          document.body.appendChild(table);
          history.replaceState({ uploaded: true }, '');
          window.chrome = {
            extension: { getURL: jasmine.createSpy('gerURL') },
            storage: {
              local: {
                get: jasmine.createSpy().and.callFake((_, cb) => {
                  cb({
                    [1234]: { caseId: '531591' },
                    options: { recap_enabled: true },
                  });
                }),
                set: jasmine.createSpy('set').and.callFake(function () {}),
              },
            },
          };
        });

        afterEach(function () {
          history.replaceState({}, '');
        });

        it('has no effect', function () {
          const cd = docketDisplayContentDelegate;
          spyOn(cd.recap, 'uploadDocket');
          cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).not.toHaveBeenCalled();
        });
      });

      describe('when the docket page is an interstitial page', function () {
        let input, input2;

        beforeEach(function () {
          clearDocumentBody();
          table = document.createElement('table');
          const tbody = document.createElement('tbody');
          const tr = document.createElement('tr');
          tbody.appendChild(tr);
          table.appendChild(tbody);
          input = document.createElement('input');
          input.id = 'input1';
          input.name = 'date_from';
          input.type = 'radio';
          input2 = input.cloneNode();
          input2.id = 'input2';
          document.body.appendChild(input);
          document.body.appendChild(input2);
          document.body.appendChild(table);
          window.chrome = {
            extension: { getURL: jasmine.createSpy('gerURL') },
            storage: {
              local: {
                get: jasmine.createSpy().and.callFake((_, cb) => {
                  cb({
                    [1234]: { caseId: '531591' },
                    options: { recap_enabled: true },
                  });
                }),
                set: jasmine.createSpy('set').and.callFake(function () {}),
              },
            },
          };
        });

        it('does not call uploadDocket', async function () {
          const cd = docketDisplayContentDelegate;
          spyOn(cd.recap, 'uploadDocket');
          await cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).not.toHaveBeenCalled();
        });
      });

      describe('when the docket page is not an interstitial page', function () {
        beforeEach(function () {
          clearDocumentBody();
          table = document.createElement('table');
          const tbody = document.createElement('tbody');
          const tr = document.createElement('tr');
          tbody.appendChild(tr);
          table.appendChild(tbody);
          document.body.appendChild(table);
          window.chrome = {
            extension: { getURL: jasmine.createSpy('gerURL') },
            storage: {
              local: {
                get: jasmine.createSpy().and.callFake((_, cb) => {
                  cb({
                    [1234]: { caseId: '531591' },
                    options: { recap_enabled: true },
                  });
                }),
                set: jasmine.createSpy('set').and.callFake(function () {}),
              },
            },
          };
        });

        it('inserts a button linking the user to a create alert page on CL', async () => {
          const cd = docketDisplayContentDelegate;
          await cd.handleDocketDisplayPage();
          const button = document.querySelectorAll('#recap-alert-button')[0];
          expect(button).not.toBeNull();
        });

        it('calls uploadDocket and responds to a positive result', async function () {
          const cd = docketDisplayContentDelegate;
          spyOn(cd.notifier, 'showUpload');
          spyOn(cd.recap, 'uploadDocket').and.callFake((pc, pci, h, ut, cb) => {
            cb.tab = { id: 1234 };
            cb(true);
          });
          spyOn(history, 'replaceState');
          jasmine.Ajax.stubRequest(
            'https://www.courtlistener.com/api/rest/v3/dockets/?pacer_case_id=531591&source__in=1%2C3%2C5%2C7%2C9%2C11%2C13%2C15&court=canb&fields=absolute_url%2Cdate_modified'
          ).andReturn({
            contentType: 'application/json',
            responseText: JSON.stringify({ count: 1 }),
            status: 200,
          });
          await cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).toHaveBeenCalled();
          expect(cd.notifier.showUpload).toHaveBeenCalled();
          expect(history.replaceState).toHaveBeenCalledWith({ uploaded: true }, '');
          const button = document.querySelectorAll('#create-alert-button');
          expect(button.length).toBe(1);
        });

        it('calls uploadDocket and responds to a positive historical result', async function () {
          const cd = historyDocketDisplayContentDelegate;
          spyOn(cd.notifier, 'showUpload');
          spyOn(cd.recap, 'uploadDocket').and.callFake((pc, pci, h, ut, cb) => {
            cb.tab = { id: 1234 };
            cb(true);
          });
          spyOn(history, 'replaceState');
          jasmine.Ajax.stubRequest(
            'https://www.courtlistener.com/api/rest/v3/dockets/?pacer_case_id=531591&source__in=1%2C3%2C5%2C7%2C9%2C11%2C13%2C15&court=canb&fields=absolute_url%2Cdate_modified'
          ).andReturn({
            contentType: 'application/json',
            responseText: JSON.stringify({ count: 1 }),
            status: 200,
          });
          await cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).toHaveBeenCalled();
          expect(cd.notifier.showUpload).toHaveBeenCalled();
          expect(history.replaceState).toHaveBeenCalledWith({ uploaded: true }, '');
          const button = document.querySelectorAll('#create-alert-button');
          expect(button.length).toBe(1);
        });

        it('calls uploadDocket and responds to a negative result', async function () {
          const cd = docketDisplayContentDelegate;
          spyOn(cd.notifier, 'showUpload');
          spyOn(cd.recap, 'uploadDocket').and.callFake((pc, pci, h, ut, cb) => {
            cb.tab = { id: 1234 };
            cb(false);
          });
          spyOn(history, 'replaceState');
          await cd.handleDocketDisplayPage();
          expect(cd.recap.uploadDocket).toHaveBeenCalled();
          expect(cd.notifier.showUpload).not.toHaveBeenCalled();
          expect(history.replaceState).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('handleAttachmentMenuPage', function () {
    describe('option disabled', function () {
      let form;
      let input;
      let mainContainer;

      beforeEach(function () {
        clearDocumentBody();
        mainContainer = document.createElement('div');
        mainContainer.id = 'cmecfMainContent';
        form = document.createElement('form');
        window.chrome = {
          storage: {
            local: {
              get: jasmine.createSpy().and.callFake(function (_, cb) {
                cb({ options: { recap_enabled: false } });
              }),
              set: jasmine.createSpy('set').and.callFake(function () {}),
            },
          },
        };
        input = document.createElement('input');
        input.value = 'Download All';
        form.appendChild(input);
        mainContainer.appendChild(form);
        document.getElementById = jasmine
          .createSpy('getElementById')
          .and.callFake((id) => (id != 'cmecfMainContent' ? null : mainContainer));
      });

      afterEach(function () {
        form.remove();
        mainContainer.remove();
        delete window.chrome;
      });

      it('has no effect recap_enabled option is not set', function () {
        const cd = singleDocContentDelegate;
        spyOn(cd.recap, 'uploadAttachmentMenu');
        cd.handleAttachmentMenuPage();
        expect(cd.recap.uploadAttachmentMenu).not.toHaveBeenCalled();
      });
    });

    describe('option enabled', function () {
      let mainContainer;
      let form;

      beforeEach(function () {
        clearDocumentBody();
        mainContainer = document.createElement('div');
        mainContainer.id = 'cmecfMainContent';
        form = document.createElement('form');
        mainContainer.appendChild(form);
        document.body.appendChild(mainContainer);
        window.chrome = {
          storage: {
            local: {
              get: jasmine.createSpy().and.callFake(function (_, cb) {
                cb({ options: { recap_enabled: true } });
              }),
              set: jasmine.createSpy('set').and.callFake(function () {}),
            },
          },
        };
        document.getElementById = jasmine.createSpy('getElementById').and.callFake((id) => {
          return document.querySelectorAll(`#${id}`)[0];
        });
      });

      afterEach(function () {
        form.remove();
        mainContainer.remove();
        delete window.chrome;
      });

      describe('when the history state is already set', function () {
        beforeEach(function () {
          history.replaceState({ uploaded: true }, '');
        });

        afterEach(function () {
          history.replaceState({}, '');
        });

        it('has no effect', function () {
          const cd = docketDisplayContentDelegate;
          spyOn(cd.recap, 'uploadAttachmentMenu');
          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).not.toHaveBeenCalled();
        });
      });

      describe('when there is NO appropriate form', function () {
        it('has no effect when the URL is wrong', function () {
          const cd = nonsenseUrlContentDelegate;
          spyOn(cd.recap, 'uploadAttachmentMenu');
          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).not.toHaveBeenCalled();
        });

        it('has no effect with a proper URL', function () {
          const cd = singleDocContentDelegate;
          spyOn(cd.recap, 'uploadAttachmentMenu');
          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).not.toHaveBeenCalled();
        });
      });

      describe('when there IS an appropriate form', function () {
        let download_input;
        let view_input;

        beforeEach(function () {
          download_input = document.createElement('input');
          download_input.value = 'Download All';
          download_input.type = 'button';
          view_input = document.createElement('input');
          view_input.value = 'View All';
          view_input.type = 'button';
          form.appendChild(view_input);
          form.appendChild(download_input);
        });

        afterEach(function () {
          download_input.remove();
          view_input.remove();
        });

        it('has no effect when the URL is wrong', function () {
          const cd = nonsenseUrlContentDelegate;
          spyOn(cd.recap, 'uploadAttachmentMenu');
          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).not.toHaveBeenCalled();
        });

        it('uploads the page when the URL is right', function () {
          const cd = singleDocContentDelegate;
          spyOn(cd.recap, 'uploadAttachmentMenu');
          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).toHaveBeenCalled();
        });

        it('calls the upload method and responds to positive result', function () {
          const cd = singleDocContentDelegate;
          const uploadFake = function (pc, pci, h, ut, callback) {
            callback(true);
          };
          spyOn(cd.recap, 'uploadAttachmentMenu').and.callFake(uploadFake);
          spyOn(cd.notifier, 'showUpload');
          spyOn(history, 'replaceState');

          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).toHaveBeenCalled();
          expect(cd.notifier.showUpload).toHaveBeenCalled();
          expect(history.replaceState).toHaveBeenCalledWith({ uploaded: true }, '');
        });

        it('calls the upload method and responds to negative result', function () {
          const cd = singleDocContentDelegate;
          const uploadFake = function (pc, pci, h, ut, callback) {
            callback(false);
          };
          spyOn(cd.recap, 'uploadAttachmentMenu').and.callFake(uploadFake);
          spyOn(cd.notifier, 'showUpload');
          spyOn(history, 'replaceState');

          cd.handleAttachmentMenuPage();
          expect(cd.recap.uploadAttachmentMenu).toHaveBeenCalled();
          expect(cd.notifier.showUpload).not.toHaveBeenCalled();
          expect(history.replaceState).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('handleSingleDocumentPageCheck', function () {
    let form;
    beforeEach(function () {
      clearDocumentBody();
      form = document.createElement('form');
      document.body.appendChild(form);
    });

    afterEach(function () {
      form.remove();
    });

    describe('when there is NO appropriate form', function () {
      it('has no effect when the URL is wrong', function () {
        const cd = nonsenseUrlContentDelegate;
        spyOn(cd.recap, 'getAvailabilityForDocuments');
        cd.handleSingleDocumentPageCheck();
        expect(cd.recap.getAvailabilityForDocuments).not.toHaveBeenCalled();
      });

      it('has no effect with a proper URL', function () {
        const cd = singleDocContentDelegate;
        spyOn(cd.recap, 'getAvailabilityForDocuments');
        cd.handleSingleDocumentPageCheck();
        expect(cd.recap.getAvailabilityForDocuments).not.toHaveBeenCalled();
      });
    });

    describe('when there IS an appropriate form', function () {
      let input;
      let table;

      beforeEach(function () {
        input = document.createElement('input');
        input.value = 'View Document';
        form.appendChild(input);

        table = document.createElement('table');
        const table_tr = document.createElement('tr');
        const table_td = document.createElement('td');
        table_td.appendChild(document.createTextNode('Image'));
        table_tr.appendChild(table_td);
        table.appendChild(table_tr);
        document.body.appendChild(table);
      });

      afterEach(function () {
        // no need to remove input because it is added to
        // the form and removed in the outer scope
        table.remove();
      });

      it('has no effect when the URL is wrong', function () {
        const cd = nonsenseUrlContentDelegate;
        spyOn(cd.recap, 'getAvailabilityForDocuments');
        cd.handleSingleDocumentPageCheck();
        expect(cd.recap.getAvailabilityForDocuments).not.toHaveBeenCalled();
      });

      it('checks availability for the page when the URL is right', function () {
        const cd = singleDocContentDelegate;
        spyOn(cd.recap, 'getAvailabilityForDocuments');
        cd.handleSingleDocumentPageCheck();
        expect(cd.recap.getAvailabilityForDocuments).toHaveBeenCalled();
      });

      describe('for pacer doc id 531591', function () {
        beforeEach(function () {
          window.pacer_doc_id = 531591;
          let banner = document.querySelectorAll('.recap-banner')[0];
          if (banner) {
            banner.remove();
          }
        });

        afterEach(function () {
          delete window.pacer_doc_id;
        });

        it('responds to a positive result', function () {
          const fakePacerDocId = 531591;
          const cd = singleDocContentDelegate;
          const fake = function (pc, pci, callback) {
            const response = {
              results: [
                {
                  pacer_doc_id: fakePacerDocId,
                  filepath_local: 'download/1234',
                },
              ],
            };
            callback(response);
          };
          spyOn(cd.recap, 'getAvailabilityForDocuments').and.callFake(fake);

          cd.handleSingleDocumentPageCheck();

          expect(cd.recap.getAvailabilityForDocuments).toHaveBeenCalled();
          const banner = document.querySelectorAll('.recap-banner')[0];
          expect(banner).not.toBeNull();
          const link = banner.querySelector('a');
          expect(link).not.toBeNull();
          expect(link.href).toBe('https://storage.courtlistener.com/download/1234');
        });

        it('responds to a negative result', function () {
          const cd = singleDocContentDelegate;
          const fake = function (pc, pci, callback) {
            const response = {
              results: [{}],
            };
            callback(response);
          };
          spyOn(cd.recap, 'getAvailabilityForDocuments').and.callFake(fake);

          cd.handleSingleDocumentPageCheck();

          expect(cd.recap.getAvailabilityForDocuments).toHaveBeenCalled();
          let bannerHTMLElement = document.querySelectorAll('.recap-banner');
          let banner = !!bannerHTMLElement.length ? bannerHTMLElement[0] : null;
          expect(banner).toBeNull();
        });
      });
    });
  });

  describe('handleSingleDocumentPageView', function () {
    let form;
    beforeEach(function () {
      form = document.createElement('form');
      document.body.appendChild(form);
    });

    afterEach(function () {
      form.remove();
    });

    describe('when there is NO appropriate form', function () {
      it('has no effect when the URL is wrong', function () {
        const cd = nonsenseUrlContentDelegate;
        spyOn(document, 'createElement');
        cd.handleSingleDocumentPageView();
        expect(document.createElement).not.toHaveBeenCalled();
      });

      it('has no effect with a proper URL', function () {
        const cd = singleDocContentDelegate;
        spyOn(cd.recap, 'getAvailabilityForDocuments');
        cd.handleSingleDocumentPageView();
        expect(cd.recap.getAvailabilityForDocuments).not.toHaveBeenCalled();
      });
    });

    describe('when there IS an appropriate form', function () {
      let input;
      let table;

      beforeEach(function () {
        input = document.createElement('input');
        input.value = 'View Document';
        form.appendChild(input);

        table = document.createElement('table');
        const table_tr = document.createElement('tr');
        const table_td = document.createElement('td');
        table_td.appendChild(document.createTextNode('Image'));
        table_tr.appendChild(table_td);
        table.appendChild(table_tr);
        document.body.appendChild(table);
        spyOn(window, 'addEventListener').and.callThrough();
        spyOnProperty(document, 'cookie').and.returnValue('test_cookie1=false; test_cookie2=true; isFilingAccount=false');
      });

      afterEach(function () {
        table.remove();
        const scripts = [...document.querySelectorAll('script')];
        const lastScript = scripts.find((script) => script.innerText.match(/^document\.createElement/));
        if (lastScript) {
          lastScript.remove();
        }
      });

      it('creates a non-empty script element', function () {
        const cd = singleDocContentDelegate;
        const scriptSpy = {};
        spyOn(document, 'createElement').and.returnValue(scriptSpy);
        spyOn(document.body, 'appendChild');
        cd.handleSingleDocumentPageView();

        expect(document.createElement).toHaveBeenCalledWith('script');
        expect(scriptSpy.innerText).toEqual(jasmine.any(String));
        expect(document.body.appendChild).toHaveBeenCalledWith(scriptSpy);
      });

      it('adds an event listener for the message in the script', function () {
        const cd = singleDocContentDelegate;
        cd.handleSingleDocumentPageView();
        expect(window.addEventListener).toHaveBeenCalled();
        expect(window.addEventListener).toHaveBeenCalledWith('message', jasmine.any(Function), false);
      });
    });
  });

  describe('onDocumentViewSubmit', function () {
    let form;
    let table;
    const form_id = 'submit_form';
    const event = { data: { id: form_id }, origin: 'https://ecf.pamd.uscourts.gov' };

    beforeEach(function () {
      clearDocumentBody();
      form = document.createElement('form');
      form.id = form_id;
      document.body.appendChild(form);

      table = document.createElement('table');
      let tr_image = document.createElement('tr');
      let td_image = document.createElement('td');
      td_image.innerHTML = 'Image 1234-9876';
      tr_image.appendChild(td_image);
      table.appendChild(tr_image);
      document.body.appendChild(table);
      document.getElementById = jasmine.createSpy('getElementById').and.callFake((id) => {
        return document.querySelectorAll(`#${id}`)[0];
      });
    });

    afterEach(function () {
      form.remove();
      table.remove();
    });

    it('sets the onsubmit attribute of the page form', function () {
      const expected_on_submit = 'expectedOnSubmit();';
      form.setAttribute('onsubmit', expected_on_submit);
      spyOn(form, 'setAttribute');
      singleDocContentDelegate.onDocumentViewSubmit(event);

      expect(form.setAttribute).toHaveBeenCalledWith('onsubmit', 'history.forward(); return false;');
      expect(form.setAttribute).toHaveBeenCalledWith('onsubmit', expected_on_submit);
    });

    it('calls showPdfPage when the response is a PDF', function () {
      const cd = singleDocContentDelegate;
      spyOn(cd, 'showPdfPage');
      cd.onDocumentViewSubmit(event);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'application/pdf',
        responseText: pdf_data,
      });
      expect(cd.showPdfPage).toHaveBeenCalled();
    });

    it('calls showPdfPage when the response is HTML', function () {
      const cd = singleDocContentDelegate;
      const fakeFileReader = {
        readAsText: function () {
          this.result = '<html lang="en"></html>';
          this.onload();
        },
      };
      spyOn(window, 'FileReader').and.callFake(function () {
        return fakeFileReader;
      });
      spyOn(cd, 'showPdfPage');
      cd.onDocumentViewSubmit(event);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'text/html',
        responseText: '<html lang="en"></html>',
      });
      expect(cd.showPdfPage).toHaveBeenCalled();
    });
  });

  describe('showPdfPage', function () {
    let documentElement;
    const pre =
      '<head><title>test</title><style>body { margin: 0; } iframe { border: none; }' + '</style></head><body>';
    const iFrameStart = '<iframe src="data:pdf"';
    const iFrameEnd = ' width="100%" height="100%"></iframe>';
    const post = '</body>';
    const html = pre + iFrameStart + iFrameEnd + post;
    const cd = singleDocContentDelegate;
    const blob = new Blob([new ArrayBuffer(1000)], { type: 'application/pdf' });

    beforeEach(async function () {
      clearDocumentBody();
      const dataUrl = await blobToDataURL(blob);
      documentElement = document.createElement('html');
      window.chrome = {
        storage: {
          local: {
            get: jasmine.createSpy().and.callFake((_, cb) => {
              cb({
                options: {
                  recap_enabled: true,
                  ['ia_style_filenames']: true,
                  ['lawyer_style_filenames']: false,
                  ['external_pdf']: true,
                },
                [tabId]: {
                  ['pdf_blob']: dataUrl,
                  docsToCases: { ['034031424909']: '531591' },
                },
              });
            }),
            remove: jasmine.createSpy('remove').and.callFake(function () {}),
            set: jasmine.createSpy('set').and.callFake(function () {}),
          },
        },
      };
      spyOn(cd.recap, 'uploadDocument').and.callFake(
        (
          court,
          caseId,
          docId,
          docNumber,
          attachNumber,
          acmsDocumentGuid,
          callback
        ) => {
          callback.tab = { id: 1234 };
          callback(true);
        }
      );
      document.getElementById = jasmine.createSpy('getElementById').and.callFake((id) => {
        return document.querySelectorAll(`#${id}`)[0];
      });
    });

    afterEach(() => {
      delete window.chrome;
    });

    it('handles no iframe', function () {
      let inner = '<span>html</span>';
      cd.showPdfPage(pre + inner + post);
      expect(document.documentElement.innerHTML).toBe(pre + inner + post);
    });

    it('correctly extracts the data before and after the iframe', async function () {
      await cd.showPdfPage(html);
      // removed waiting check because the content_delegate
      // removes the paragraph if successful which seems to occur prior
      // to the test running - checking for the new Iframe should be sufficient
      const expected_iframe = '<iframe src="about:blank"' + iFrameEnd;
      expect(document.documentElement.innerHTML).toBe(pre + expected_iframe + post);
    });

    describe('when it downloads the PDF in the iframe', function () {
      const casenum = '437098';
      const cd = singleDocContentDelegate;

      beforeEach(function () {
        window.getPacerCaseIdFromPacerDocId = jasmine.createSpy().and.callFake((tbid, pcId) => {
          return casenum;
        });
        spyOn(cd.notifier, 'showUpload').and.callFake((message, cb) => cb(true));
        spyOn(URL, 'createObjectURL').and.returnValue('data:blob');
        spyOn(history, 'pushState').and.callFake(() => {});

        window.saveAs = jasmine.createSpy('saveAs').and.callFake(() => Promise.resolve(true));
        // jasmine.Ajax.requests.mostRecent().respondWith({
        //   'status' : 200,
        //   'contentType' : 'application/pdf',
        //   'responseText' : pdf_data
        // });
      });

      afterEach(function () {
        window.getPacerCaseIdFromPacerDocId = jasmine.createSpy().and.callThrough();
      });

      it('makes the back button redisplay the previous page', async function () {
        await cd.showPdfPage(html);
        expect(window.onpopstate).toEqual(jasmine.any(Function));
        window.onpopstate({ state: { content: 'previous' } });
        expect(document.documentElement.innerHTML).toBe('<head></head><body>previous</body>');
      });

      it('displays the page with the downloaded file in an iframe', async function () {
        await cd.showPdfPage(html);
        if (navigator.userAgent.indexOf('Chrome') < 0 && navigator.plugins.namedItem('Chrome PDF Viewer')) {
          // isExternalPdf, file is saved with saveAs
          // Test fails on Chrome 78.0.3904 because carriage returns
          // are present in the grabbed html. A quick fix is to use
          // a set of non-null characters [^\0] instead of the dot
          // operator -- see https://www.regular-expressions.info/dot.html
          const iframe = document.querySelectorAll('iframe[src="data:blob"]')[0];
          expect(iframe).not.toBeNull();
        } else {
          const iframe = document.querySelectorAll('iframe[src="about:blank"]')[0];
          expect(iframe).not.toBeNull();
          expect(window.saveAs).toHaveBeenCalled();
        }
      });

      it('puts the generated HTML in the page history', async function () {
        await cd.showPdfPage(html);
        if (navigator.userAgent.indexOf('Chrome') < 0 && navigator.plugins.namedItem('Chrome PDF Viewer')) {
          // isExternalPdf, file is saved with saveAs
          expect(history.pushState).toHaveBeenCalled();
        } else {
          expect(history.pushState).not.toHaveBeenCalled();
          expect(window.saveAs).toHaveBeenCalled();
        }
      });

      it('uploads the PDF to RECAP', async function () {
        await cd.showPdfPage(html);
        expect(cd.recap.uploadDocument).toHaveBeenCalled();
      });

      it('calls the notifier once the upload finishes', async function () {
        await cd.showPdfPage(html);
        expect(cd.notifier.showUpload).toHaveBeenCalled();
      });
    });
  });

  function linksFromUrls(urls) {
    let index;
    const links = [];
    for (index = 0; index < urls.length; index++) {
      const link = document.createElement('a');
      link.href = urls[index];
      if (index === 0) {
        link.dataset.pacer_doc_id = '1234';
      }
      links.push(link);
    }
    return links;
  }

  describe('findAndStorePacerDocIds', function () {
    afterEach(function () {
      window.getPacerCaseIdFromPacerDocId = jasmine.createSpy().and.callThrough();
    });

    it('should handle no cookie', async function () {
      spyOn(PACER, 'hasPacerCookie').and.returnValue(false);
      expect(await nonsenseUrlContentDelegate.findAndStorePacerDocIds()).toBe(undefined);
    });
    it('should handle pages without case ids', async function () {
      const cd = noPacerCaseIdContentDelegate;
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      window.getPacerCaseIdFromPacerDocId = jasmine
        .createSpy('getPacerCaseIdFromPacerDocId')
        .and.callFake((tbId, pdid) => {
          return '531931';
        });
      chrome.storage.local.set = function (docs, cb) {
        cb();
      };
      await cd.findAndStorePacerDocIds();
      expect(window.getPacerCaseIdFromPacerDocId).toHaveBeenCalled();
    });
    it('should iterate links for DLS', async function () {
      const link_2 = document.createElement('a');
      link_2.href = 'https://ecf.canb.uscourts.gov/notacase/034031424909';
      const link_3 = document.createElement('a');
      link_3.href = 'https://ecf.canb.uscourts.gov/doc1/034031424910';
      const link_4 = document.createElement('a');
      link_4.href = 'https://ecf.canb.uscourts.gov/doc1/034031424911';
      const test_links = [link_2, link_3, link_4];
      const docketQueryWithLinksContentDelegate = new ContentDelegate(
        tabId, // tabId
        docketQueryUrl, // url
        docketQueryPath, // path
        'canb', // court
        undefined, // pacer_case_id
        '127015406472', // pacer_doc_id
        test_links // links
      );

      let documents = {};
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      spyOn(PACER, 'parseGoDLSFunction').and.returnValue({ de_caseid: '1234' });
      const cd = docketQueryWithLinksContentDelegate;
      chrome.storage.local.set = function (storagePayload, cb) {
        const docs = storagePayload[tabId].docsToCases;
        documents = docs;
        cb();
      };
      await cd.findAndStorePacerDocIds();
      window.getPacerCaseIdFromPacerDocId = jasmine
        .createSpy('getPacerCaseIdFromPacerDocId')
        .and.callFake((tbId, pdid) => {
          return null;
        });
      expect(documents).toEqual({ '034031424910': '1234', '034031424911': '1234' });
    });
    it('should iterate links for PACER case id', async function () {
      const link_2 = document.createElement('a');
      link_2.href = 'https://ecf.canb.uscourts.gov/notacase/034031424909';
      const link_3 = document.createElement('a');
      link_3.href = 'https://ecf.canb.uscourts.gov/doc1/034031424910';
      const link_4 = document.createElement('a');
      link_4.href = 'https://ecf.canb.uscourts.gov/doc1/034031424911';
      const test_links = [link_2, link_3, link_4];
      const docketQueryWithLinksContentDelegate = new ContentDelegate(
        tabId,
        docketQueryUrl, // url
        docketQueryPath, // path
        'canb', // court
        '123456', // pacer_case_id
        'redfox', // pacer_doc_id
        test_links // links
      );
      let documents = {};
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      const cd = docketQueryWithLinksContentDelegate;
      chrome.storage.local.set = function (storagePayload, cb) {
        const docs = storagePayload[tabId].docsToCases;
        documents = docs;
        cb();
      };
      await cd.findAndStorePacerDocIds();
      expect(documents).toEqual({
        redfox: '123456',
        '034031424910': '123456',
        '034031424911': '123456',
      });
    });
    it('should work only for doc1 links', async function () {
      let test_links = [];
      let urls = [
        'https://ecf.canb.uscourts.gov/notacase/034031424909',
        'https://ecf.canb.uscourts.gov/doc1/034031424910',
        'https://ecf.canb.uscourts.gov/doc1/034031424911',
        'https://ecf.pamb.uscourts.gov/cgi-bin/show_doc.pl?caseid=260973&claim_id=15342915&claim_num=1-1&magic_num=MAGIC',
        'https://ecf.pamb.uscourts.gov/cgi-bin/show_doc.pl?caseid=171908&de_seq_num=981&dm_id=15184563&doc_num=287'
      ];
      for (url of urls) {
        link = document.createElement('a');
        link.href = url;
        test_links.push(link);
      }
      const docketQueryWithLinks = new ContentDelegate(
        tabId,
        docketQueryUrl, // url
        docketQueryPath, // path
        'canb', // court
        '123456', // pacer_case_id
        'redfox', // pacer_doc_id
        test_links // links
      );
      spyOn(PACER, 'hasPacerCookie').and.returnValue(true);
      spyOn(PACER, 'getDocumentIdFromUrl').and.callThrough();
      chrome.storage.local.set = function (storagePayload, cb) {
        const docs = storagePayload[tabId].docsToCases;
        documents = docs;
        cb();
      };
      await docketQueryWithLinks.findAndStorePacerDocIds();
      expect(PACER.getDocumentIdFromUrl).toHaveBeenCalledTimes(2);
    })
  });

  // TODO: Figure out where the functionality of
  //  'addMouseoverToConvertibleLinks' went, and add tests for that.
  describe('attachRecapLinkToEligibleDocs', function () {
    const fake_urls = ['http://foo.fake/bar/0', 'http://foo.fake/bar/1'];

    const urls = ['https://ecf.canb.uscourts.gov/doc1/034031424909', 'https://ecf.canb.uscourts.gov/doc1/034031438754'];
    const expected_url = 'https://ecf.canb.uscourts.gov/cgi-bin/DktRpt.pl?531591';

    describe('when there are no valid urls', function () {
      let links;
      let cd;
      beforeEach(function () {
        clearDocumentBody();
        links = linksFromUrls(fake_urls);
        cd = new ContentDelegate(tabId, expected_url, null, null, null, null, links);
        cd.attachRecapLinkToEligibleDocs();
      });

      it('does nothing', function () {
        expect(jasmine.Ajax.requests.mostRecent()).toBeUndefined();
      });
    });

    describe('when there are valid urls', function () {
      let links;
      let cd;
      beforeEach(function () {
        clearDocumentBody();
        links = linksFromUrls(urls);
        for (let link of links) {
          document.body.append(link);
        }
        cd = new ContentDelegate(tabId, expected_url, null, null, null, null, links);
        cd.pacer_doc_ids = [1234];
      });

      afterEach(function () {
        for (let link of links) {
          link.remove();
        }
      });

      it('does not attach any links if no urls have recap', function () {
        spyOn(cd.recap, 'getAvailabilityForDocuments').and.callFake(function (pc, pci, callback) {
          callback({
            results: [],
          });
        });
        cd.attachRecapLinkToEligibleDocs();
        recap_inline = document.querySelectorAll('.recap-inline');
        expect(recap_inline.length).toBe(0);
      });

      it('attaches a single link to the one url with recap', function () {
        spyOn(cd.recap, 'getAvailabilityForDocuments').and.callFake(function (pc, pci, callback) {
          callback({
            results: [{ pacer_doc_id: 1234, filepath_local: 'download/1234' }],
          });
        });
        cd.attachRecapLinkToEligibleDocs();
        let recap_inline = document.querySelectorAll('.recap-inline');
        expect(recap_inline.length).toBe(1);
        recap_inline[0].remove();
      });
    });
  });
});
