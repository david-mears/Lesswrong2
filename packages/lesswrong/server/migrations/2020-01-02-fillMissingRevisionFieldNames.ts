import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';
import { getCollection } from '../../lib/vulcan-lib';
import Revisions from '../../lib/collections/revisions/collection'

registerMigration({
  name: "fillMissingRevisionFieldNamesOnSingleEditableCollections",
  dateWritten: "2020-01-02",
  idempotent: true,
  action: async () => {
    for (let { collectionName, fieldName } of collectionsWithExactlyOneEditableField()) {
      // eslint-disable-next-line no-console
      console.log(`Filling in fieldName for collection: ${collectionName}, field: ${fieldName}`);
      const collection = getCollection(collectionName);
      await forEachDocumentBatchInCollection({
        collection, batchSize: 1000,
        callback: async (documents) => {
          Revisions.update(
            { documentId: { $in: documents.map(doc => doc._id) } },
            { $set: {fieldName} },
            { multiple: true }
          );
        }
      });
    }
  }
});

function collectionsWithExactlyOneEditableField(): Array<{collectionName:string, fieldName:string}>
{
  let result: Array<{collectionName:string, fieldName:string}> = [];
  for (let collectionName of editableCollections) {
    if (editableCollectionsFields[collectionName].length === 1) {
      result.push({
        collectionName,
        fieldName: editableCollectionsFields[collectionName][0],
      });
    }
  }
  return result;
}
