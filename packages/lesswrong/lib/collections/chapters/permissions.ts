import Users from '../users/collection';
import Chapters from './collection';

const membersActions = [
  "chapters.view.own",
  "chapters.new.own",
  "chapters.edit.own",
  "chapters.remove.own",
];
Users.groups.members.can(membersActions);

const adminActions = [
  "chapters.view.all",
  "chapters.new.all",
  "chapters.edit.all",
  "chapters.remove.all",
];
Users.groups.admins.can(adminActions);

Chapters.checkAccess = (user, document) => {
  if (!document) return false;
  // Since chapters have no userIds there is no obvious way to check for permissions.
  // We might want to check the parent sequence, but that seems too costly, so for now just be permissinve
  return true
};
