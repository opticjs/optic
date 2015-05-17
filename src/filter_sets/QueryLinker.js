// import FilterSet from '../core/FilterSet';
// import Query from '../core/Query';
// import * as Utils from '../core/Utils';

// var QueryLinker = FilterSet.extend({
//   init() {
//     this._queryBuckets = {};
//   },

//   filters() {
//     return [
//       {
//         from: Query.States.IDLE,
//         to: Query.States.SUBMITTING,
//         filter: (query, emitResponse, cb) => {
//           var key = query.toString(false);
//           var bucket = this._queryBuckets[key];

//           if (bucket) {
//             bucket.callbacks.push({
//               query: query,
//               emitResponse: emitResponse,
//               cb: cb
//             });
//           } else {
//             this._queryBuckets[key] = {
//               originalQuery: query,
//               callbacks: []
//             };
//             cb();
//           }
//         }
//       },

//       {
//         to: Query.States.DONE,
//         filter: (query, emitResponse, cb) => {
//           var key = query.toString(false);
//           var bucket = this._queryBuckets[key];

//           if (bucket && bucket.originalQuery === query) {
//             Utils.each(bucket.callbacks, cbs => {
//               cbs.emitResponse(query.getFinalResponse());
//               cbs.cb(Query.States.DONE);
//             });
//             this._queryBuckets[key] = null;
//           }

//           cb();
//         }
//       }
//     ];
//   },

//   queryMethods() {
//     return {};
//   }
// });

// export default QueryLinker;
