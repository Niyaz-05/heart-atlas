import { expect, it } from 'vitest';
import { publicationAllowed } from './check-medical-review.mjs';
it('lets an unchanged expired publication show needs_review, never publishes a new expired article', () => {
 expect(publicationAllowed({legacy:false,previouslyPublished:true,state:'needs_review',expiredOnly:true,hasReview:true})).toBe(true);
 expect(publicationAllowed({legacy:false,previouslyPublished:false,state:'needs_review',expiredOnly:true,hasReview:true})).toBe(false);
 expect(publicationAllowed({legacy:true,previouslyPublished:true,state:'needs_review',expiredOnly:false,hasReview:true})).toBe(false);
 expect(publicationAllowed({legacy:true,previouslyPublished:true,state:'unreviewed',expiredOnly:false,hasReview:false})).toBe(true);
});
