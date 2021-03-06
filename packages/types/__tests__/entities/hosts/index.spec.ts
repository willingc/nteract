import { ofHostType } from "../../../src/entities/hosts";
import { from } from "rxjs";
import { count } from "rxjs/operators";

describe("ofHostType", () => {
  it("filters by the host type provided", () => {
    from([
      {
        core: {
          app: {
            host: {
              type: "local"
            }
          }
        }
      }
    ])
      .pipe(ofHostType("local"), count())
      .toPromise()
      .then(value => expect(value).toEqual(1));
  });
  it("omits values that do not match the host type provided", () => {
    from([
      {
        core: {
          app: {
            host: {
              type: "local"
            }
          }
        }
      }
    ])
      .pipe(ofHostType("jupyter"), count())
      .toPromise()
      .then(value => expect(value).toEqual(0));
  });
  it("supports filtering by multiple host types", () => {
    from([
      {
        core: {
          app: {
            host: {
              type: "local"
            }
          }
        }
      }
    ])
      .pipe(ofHostType("jupyter", "local"), count())
      .toPromise()
      .then(value => expect(value).toEqual(1));

    from([
      {
        core: {
          app: {
            host: {
              type: "jupyter"
            }
          }
        }
      }
    ])
      .pipe(ofHostType("jupyter", "local"), count())
      .toPromise()
      .then(value => expect(value).toEqual(1));
  });
});
