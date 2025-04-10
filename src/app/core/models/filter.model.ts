import { Sort } from '@angular/material/sort';
import { ErrorMessageService } from '../services/error-message.service';

import { EitherOrPreset, GlobalPreset } from './preset.model';

export class Filter {
  title: string;
  status: string[];
  type: string;
  sort: Sort;
  labels: string[];
  milestones: string[];
  hiddenLabels: Set<string>;
  deselectedLabels: Set<string>;
  itemsPerPage: number;
  assignees: string[];

  private static readonly DEFAULT_ITEMS_PER_PAGE = 20;

  constructor({
    title,
    status,
    type,
    sort,
    labels,
    milestones,
    hiddenLabels,
    deselectedLabels,
    itemsPerPage,
    assignees
  }: {
    title: string;
    status: string[];
    type: string;
    sort: Sort;
    labels: string[];
    milestones: string[];
    hiddenLabels: Set<string>;
    deselectedLabels: Set<string>;
    itemsPerPage: number;
    assignees: string[];
  }) {
    this.title = title;
    this.status = status;
    this.type = type;
    this.sort = sort;
    this.labels = labels;
    this.milestones = milestones;
    this.hiddenLabels = hiddenLabels || new Set();
    this.deselectedLabels = deselectedLabels || new Set();
    this.itemsPerPage = itemsPerPage || 10;
    this.assignees = assignees || [];
  }

  static default(): Filter {
    return new Filter({
      title: '',
      status: [],
      type: '',
      sort: { active: 'created', direction: 'desc' },
      labels: [],
      milestones: [],
      hiddenLabels: new Set(),
      deselectedLabels: new Set(),
      itemsPerPage: 20,
      assignees: []
    });
  }

  /**
   * Create a filter from a plain JSON object.
   *
   * @param object The object to create from e.g. from LocalStorage
   * @returns
   */
  static fromObject(object: any, isGlobal = false): Partial<Filter> | Filter {
    if (isGlobal) {
      // required fields: status, type, sort, itemsPerPage
      if (!object.status || !object.type || !object.sort || !object.itemsPerPage) {
        throw new Error(ErrorMessageService.corruptPresetMessage());
      }

      const filter: Partial<Filter> = {
        title: object.title,
        status: object.status,
        type: object.type,
        sort: object.sort,
        itemsPerPage: object.itemsPerPage
      };

      return filter;
    } else {
      // required fields: status, type, sort, itemsPerPage
      if (!object.status || !object.type || !object.sort || !object.itemsPerPage) {
        throw new Error(ErrorMessageService.corruptPresetMessage());
      }

      const filter: Filter = {
        title: object.title,
        status: object.status,
        type: object.type,
        sort: object.sort,
        labels: object.labels || [],
        milestones: object.milestones || [],
        hiddenLabels: new Set(Object.keys(object.hiddenLabels).length ? object.hiddenLabels : undefined),
        deselectedLabels: new Set(Object.keys(object.deselectedLabels).length ? object.deselectedLabels : undefined),
        itemsPerPage: object.itemsPerPage,
        assignees: object.assignees || []
      };

      return filter;
    }
  }

  /**
   * Checks to see if two filters are equal.
   * TODO: https://github.com/CATcher-org/WATcher/issues/405
   * @param a The filter that is set in the app
   * @param b The filter that comes from saving a preset
   * @returns
   */
  public static isPartOfPreset(a: Filter, preset: EitherOrPreset): boolean {
    // only compare if both objects have the key
    // Compare simple scalar fields
    const b = preset.filter;
    if (a.title !== b.title) {
      return false;
    }
    if (a.type !== b.type) {
      return false;
    }
    if (a.itemsPerPage !== b.itemsPerPage) {
      return false;
    }
    if (!Filter.haveSameElements(a.status, b.status)) {
      return false;
    }
    // Compare Angular Material Sort (shallow comparison is enough)
    if (!Filter.compareMatSort(a.sort, b.sort)) {
      return false;
    }

    if (preset instanceof GlobalPreset) {
      return true;
    }

    // Compare arrays ignoring order
    if (!Filter.haveSameElements(a.labels, b.labels)) {
      return false;
    }
    if (!Filter.haveSameElements(a.milestones, b.milestones)) {
      return false;
    }
    if (!Filter.haveSameElements(a.assignees, b.assignees)) {
      return false;
    }

    // Compare sets
    if (!Filter.areSetsEqual(a.hiddenLabels, b.hiddenLabels)) {
      return false;
    }
    if (!Filter.areSetsEqual(a.deselectedLabels, b.deselectedLabels)) {
      return false;
    }

    return true;
  }

  /**
   * Returns true if two arrays contain exactly the same elements (ignoring order).
   */
  private static haveSameElements(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, idx) => val === sorted2[idx]);
  }

  /**
   * Returns true if two sets contain exactly the same elements.
   *
   * TODO: https://github.com/CATcher-org/WATcher/issues/405
   */
  private static areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) {
      return false;
    }
    for (const item of set1) {
      if (!set2.has(item)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Compare two Angular Material Sort objects for equality.
   *
   * TODO: https://github.com/CATcher-org/WATcher/issues/405
   */
  private static compareMatSort(s1: Sort, s2: Sort): boolean {
    // Both 'active' and 'direction' are simple scalar fields
    return s1.active === s2.active && s1.direction === s2.direction;
  }

  /**
   * Create a deep copy of a filter. For use when setting filters from presets.
   *
   * @param original
   * @returns A deep copied version of the filter
   */
  public static createDeepCopy(original: Filter | Partial<Filter>): Filter | Partial<Filter> {
    const filter: Partial<Filter> = {};

    if (original.title !== undefined) {
      // string can be empty, is falsy value
      filter.title = original.title;
    }

    if (original.status) {
      filter.status = [...original.status];
    }

    if (original.type) {
      filter.type = original.type;
    }

    if (original.sort) {
      filter.sort = { ...original.sort };
    }

    if (original.labels) {
      filter.labels = [...original.labels];
    }

    if (original.milestones) {
      filter.milestones = [...original.milestones];
    }

    if (original.itemsPerPage) {
      filter.itemsPerPage = original.itemsPerPage;
    }

    if (original.assignees) {
      filter.assignees = [...original.assignees];
    }

    if (original.hiddenLabels) {
      filter.hiddenLabels = new Set(original.hiddenLabels);
    }

    if (original.deselectedLabels) {
      filter.deselectedLabels = new Set(original.deselectedLabels);
    }

    const isPartial = Object.keys(original).length !== Object.keys(Filter.default()).length;

    if (isPartial) {
      return filter as Partial<Filter>;
    } else {
      return filter as Filter;
    }
  }
}
